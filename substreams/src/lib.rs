mod abi;
mod pb;

use pb::poly::v1 as poly;
use substreams::hex;
use substreams_ethereum::pb::eth::v2 as eth;
use substreams_ethereum::Event;

/// Extract FreelanceEscrow events from Ethereum logs.
/// This module corresponds to 'map_freelance_events' in substreams.yaml.
#[substreams::handlers::map]
fn map_freelance_events(block: eth::Block) -> Result<poly::FreelanceEvents, substreams::errors::Error> {
    let mut out = poly::FreelanceEvents::default();

    for log in block.logs() {
        // JobCreated(indexed uint256, indexed address, indexed address, uint256, uint256)
        if let Some(event) = abi::freelance_escrow::events::JobCreated::match_and_decode(log) {
            out.job_createds.push(poly::JobCreated {
                id: event.job_id.to_u64(),
                client: hex::encode(&event.client),
                freelancer: hex::encode(&event.freelancer),
                amount: event.amount.to_string(),
                deadline: event.deadline.to_u64(),
                ipfs_hash: "".to_string(), // Placeholder for LogData decoding
            });
        }
        
        // MilestoneReleased(indexed uint256, indexed address, indexed uint256, uint256)
        if let Some(event) = abi::freelance_escrow::events::MilestoneReleased::match_and_decode(log) {
            out.milestone_fundeds.push(poly::MilestoneFunded {
                job_id: event.job_id.to_u64(),
                milestone_id: event.m_id.to_u64(),
                amount: event.amount.to_string(),
                payer: hex::encode(&event.freelancer),
            });
        }
    }

    Ok(out)
}
