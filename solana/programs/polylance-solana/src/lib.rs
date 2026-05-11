use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("PolyLance11111111111111111111111111111111");

#[program]
pub mod polylance_solana {
    use super::*;

    /// Initialize a new cross-chain job escrow on Solana
    pub fn create_job(
        ctx: Context<CreateJob>,
        job_id: u64,
        amount: u64,
        client_evm_address: [u8; 20],
    ) -> Result<()> {
        let job = &mut ctx.accounts.job_account;
        job.job_id = job_id;
        job.client = ctx.accounts.client.key();
        job.client_evm_address = client_evm_address;
        job.amount = amount;
        job.status = JobStatus::Created;
        job.bump = *ctx.bumps.get("job_account").unwrap();
        job.freelancer = Pubkey::default(); // Not assigned yet

        // Transfer tokens to escrow
        let cpi_accounts = Transfer {
            from: ctx.accounts.client_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.client.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        Ok(())
    }

    /// Assign a freelancer to the job
    pub fn assign_freelancer(ctx: Context<AssignFreelancer>, freelancer: Pubkey) -> Result<()> {
        let job = &mut ctx.accounts.job_account;
        require!(job.status == JobStatus::Created, ErrorCode::InvalidStatus);
        require!(job.freelancer == Pubkey::default(), ErrorCode::AlreadyAssigned);

        job.freelancer = freelancer;
        job.status = JobStatus::Ongoing;

        Ok(())
    }

    /// Freelancer submits work for review
    pub fn submit_work(ctx: Context<SubmitWork>) -> Result<()> {
        let job = &mut ctx.accounts.job_account;
        require!(job.status == JobStatus::Ongoing, ErrorCode::InvalidStatus);
        
        job.status = JobStatus::Submitted;
        Ok(())
    }

    /// Initiate a dispute
    pub fn initiate_dispute(ctx: Context<InitiateDispute>) -> Result<()> {
        let job = &mut ctx.accounts.job_account;
        let signer = ctx.accounts.initiator.key();
        
        require!(
            signer == job.client || signer == job.freelancer,
            ErrorCode::Unauthorized
        );
        
        require!(
            job.status == JobStatus::Ongoing || job.status == JobStatus::Submitted,
            ErrorCode::InvalidStatus
        );

        job.status = JobStatus::Disputed;
        Ok(())
    }

    /// Complete job and release payment to freelancer
    pub fn release_payment(ctx: Context<ReleasePayment>) -> Result<()> {
        let job = &mut ctx.accounts.job_account;
        require!(
            job.status == JobStatus::Ongoing || job.status == JobStatus::Submitted,
            ErrorCode::InvalidStatus
        );

        let amount = job.amount;
        let job_id_bytes = job.job_id.to_le_bytes();
        let seeds = &[
            b"job",
            job_id_bytes.as_ref(),
            &[job.bump],
        ];
        let signer = &[&seeds[..]];

        // Transfer tokens to freelancer
        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.freelancer_token_account.to_account_info(),
            authority: ctx.accounts.job_account.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount)?;

        job.status = JobStatus::Completed;

        Ok(())
    }

    /// Resolve a dispute (Authorized only)
    pub fn resolve_dispute(ctx: Context<ResolveDispute>, verdict: u8) -> Result<()> {
        let job = &mut ctx.accounts.job_account;
        require!(job.status == JobStatus::Disputed, ErrorCode::InvalidStatus);

        let amount = job.amount;
        let job_id_bytes = job.job_id.to_le_bytes();
        let seeds = &[
            b"job",
            job_id_bytes.as_ref(),
            &[job.bump],
        ];
        let signer = &[&seeds[..]];

        if verdict == 0 { // Refund Client
            let cpi_accounts = Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.client_token_account.to_account_info(),
                authority: ctx.accounts.job_account.to_account_info(),
            };
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
                signer
            );
            token::transfer(cpi_ctx, amount)?;
        } else if verdict == 1 { // Pay Freelancer
            let cpi_accounts = Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.freelancer_token_account.to_account_info(),
                authority: ctx.accounts.job_account.to_account_info(),
            };
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
                signer
            );
            token::transfer(cpi_ctx, amount)?;
        }

        job.status = JobStatus::Completed;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(job_id: u64)]
pub struct CreateJob<'info> {
    #[account(mut)]
    pub client: Signer<'info>,
    
    #[account(
        init,
        payer = client,
        space = 8 + 8 + 32 + 32 + 20 + 8 + 1 + 1,
        seeds = [b"job", job_id.to_le_bytes().as_ref()],
        bump
    )]
    pub job_account: Account<'info, Job>,
    
    #[account(mut)]
    pub client_token_account: Account<'info, TokenAccount>,
    
    #[account(
        init,
        payer = client,
        token::mint = mint,
        token::authority = job_account,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    pub mint: Account<'info, anchor_spl::token::Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct AssignFreelancer<'info> {
    #[account(mut)]
    pub client: Signer<'info>,
    #[account(
        mut,
        seeds = [b"job", job_account.job_id.to_le_bytes().as_ref()],
        bump = job_account.bump,
        has_one = client,
    )]
    pub job_account: Account<'info, Job>,
}

#[derive(Accounts)]
pub struct SubmitWork<'info> {
    #[account(mut)]
    pub freelancer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"job", job_account.job_id.to_le_bytes().as_ref()],
        bump = job_account.bump,
        has_one = freelancer,
    )]
    pub job_account: Account<'info, Job>,
}

#[derive(Accounts)]
pub struct InitiateDispute<'info> {
    #[account(mut)]
    pub initiator: Signer<'info>,
    #[account(
        mut,
        seeds = [b"job", job_account.job_id.to_le_bytes().as_ref()],
        bump = job_account.bump,
    )]
    pub job_account: Account<'info, Job>,
}

#[derive(Accounts)]
pub struct ReleasePayment<'info> {
    #[account(mut)]
    pub client: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"job", job_account.job_id.to_le_bytes().as_ref()],
        bump = job_account.bump,
        has_one = client,
    )]
    pub job_account: Account<'info, Job>,
    
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub freelancer_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(mut)]
    pub authority: Signer<'info>, // In production, this would be tied to Wormhole VAA verification
    
    #[account(
        mut,
        seeds = [b"job", job_account.job_id.to_le_bytes().as_ref()],
        bump = job_account.bump,
    )]
    pub job_account: Account<'info, Job>,
    
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub client_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub freelancer_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct Job {
    pub job_id: u64,
    pub client: Pubkey,
    pub freelancer: Pubkey,
    pub client_evm_address: [u8; 20],
    pub amount: u64,
    pub status: JobStatus,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Copy)]
pub enum JobStatus {
    Created,
    Ongoing,
    Submitted,
    Completed,
    Disputed,
}

#[error_code]
pub mod ErrorCode {
    #[msg("Job is not in the correct status")]
    InvalidStatus,
    #[msg("Freelancer already assigned")]
    AlreadyAssigned,
    #[msg("Unauthorized")]
    Unauthorized,
}
