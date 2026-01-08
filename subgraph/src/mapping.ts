import { BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
    JobCreated,
    JobAccepted,
    JobApplied,
    WorkSubmitted,
    FundsReleased,
    MilestoneReleased,
    MilestonesDefined,
    JobCancelled,
    JobDisputed,
    ReviewSubmitted
} from "../generated/FreelanceEscrow/FreelanceEscrow"
import { Job, Review, Application, Milestone, GlobalStat } from "../generated/schema"

export function handleJobCreated(event: JobCreated): void {
    let job = new Job(event.params.jobId.toString())
    job.jobId = event.params.jobId
    job.client = event.params.client
    job.freelancer = event.params.freelancer
    job.amount = event.params.amount
    job.deadline = event.params.deadline
    job.status = "Created"
    job.paid = false
    job.totalPaidOut = BigInt.fromI32(0)
    job.createdAt = event.block.timestamp
    job.updatedAt = event.block.timestamp
    job.save()

    let stats = GlobalStat.load("1")
    if (!stats) {
        stats = new GlobalStat("1")
        stats.totalJobs = BigInt.fromI32(0)
        stats.totalVolume = BigInt.fromI32(0)
        stats.activeUsers = []
    }
    stats.totalJobs = stats.totalJobs.plus(BigInt.fromI32(1))
    stats.save()
}

export function handleJobAccepted(event: JobAccepted): void {
    let job = Job.load(event.params.jobId.toString())
    if (job) {
        job.status = "Accepted"
        job.updatedAt = event.block.timestamp
        job.save()
    }
}

export function handleJobApplied(event: JobApplied): void {
    let application = new Application(event.params.jobId.toString() + "-" + event.params.freelancer.toHex())
    application.job = event.params.jobId.toString()
    application.freelancer = event.params.freelancer
    application.stake = event.params.stake
    application.createdAt = event.block.timestamp
    application.save()
}

export function handleWorkSubmitted(event: WorkSubmitted): void {
    let job = Job.load(event.params.jobId.toString())
    if (job) {
        job.status = "Ongoing"
        job.ipfsHash = event.params.ipfsHash
        job.updatedAt = event.block.timestamp
        job.save()
    }
}

export function handleFundsReleased(event: FundsReleased): void {
    let job = Job.load(event.params.jobId.toString())
    if (job) {
        job.status = "Completed"
        job.paid = true
        job.totalPaidOut = job.totalPaidOut.plus(event.params.amount)
        job.updatedAt = event.block.timestamp
        job.save()

        let stats = GlobalStat.load("1")
        if (stats) {
            stats.totalVolume = stats.totalVolume.plus(event.params.amount)
            stats.save()
        }
    }
}

export function handleReviewSubmitted(event: ReviewSubmitted): void {
    let review = new Review(event.params.jobId.toString())
    review.job = event.params.jobId.toString()
    review.reviewer = event.params.reviewer
    review.rating = event.params.rating
    review.ipfsHash = event.params.ipfsHash
    review.createdAt = event.block.timestamp
    review.save()

    let job = Job.load(event.params.jobId.toString())
    if (job) {
        job.rating = event.params.rating
        job.save()
    }
}

export function handleMilestonesDefined(event: MilestonesDefined): void {
    let jobId = event.params.jobId.toString()
    let amounts = event.params.amounts
    let hashes = event.params.ipfsHashes

    for (let i = 0; i < amounts.length; i++) {
        let milestone = new Milestone(jobId + "-" + i.toString())
        milestone.job = jobId
        milestone.milestoneId = BigInt.fromI32(i)
        milestone.amount = amounts[i]
        milestone.ipfsHash = hashes[i]
        milestone.isReleased = false
        milestone.save()
    }
}

export function handleMilestoneReleased(event: MilestoneReleased): void {
    let milestone = Milestone.load(event.params.jobId.toString() + "-" + event.params.milestoneId.toString())
    if (milestone) {
        milestone.isReleased = true
        milestone.save()
    }
}

export function handleJobCancelled(event: JobCancelled): void {
    let job = Job.load(event.params.jobId.toString())
    if (job) {
        job.status = "Cancelled"
        job.updatedAt = event.block.timestamp
        job.save()
    }
}

export function handleJobDisputed(event: JobDisputed): void {
    let job = Job.load(event.params.jobId.toString())
    if (job) {
        job.status = "Disputed"
        job.updatedAt = event.block.timestamp
        job.save()
    }
}
