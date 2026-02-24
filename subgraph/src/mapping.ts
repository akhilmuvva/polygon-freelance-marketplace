import { BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
    FreelanceEscrow,
    JobCreated,
    JobApplied,
    FreelancerPicked,
    JobAccepted,
    FundsReleased,
    MilestoneReleased,
    DisputeRaised,
    Dispute,
    Evidence,
    Ruling,
    ReviewSubmitted
} from "../generated/FreelanceEscrow/FreelanceEscrow"
import {
    RatingUpdated,
    PortfolioUpdated
} from "../generated/FreelancerReputation/FreelancerReputation"
import { Job, Milestone, GlobalStat, Freelancer, Review, Application, Evidence as EvidenceEntity, DisputeMapping } from "../generated/schema"

export function handleJobCreated(event: JobCreated): void {
    let job = new Job(event.params.jobId.toString())
    job.jobId = event.params.jobId
    job.client = event.params.client
    job.freelancer = event.params.freelancer
    job.amount = event.params.amount
    job.deadline = event.params.deadline

    // Bind contract to fetch more details if needed
    let contract = FreelanceEscrow.bind(event.address)
    // We assume the contract has a jobs() function that returns a struct.
    // Based on the generated file, we can see the return type of jobs() if we look further down.
    // However, we can also just use the event data for now.

    job.status = "Created"
    job.paid = false
    job.totalPaidOut = BigInt.fromI32(0)
    job.createdAt = event.block.timestamp
    job.updatedAt = event.block.timestamp

    // Handle Freelancer entity
    let freelancer = Freelancer.load(event.params.freelancer.toHexString())
    if (!freelancer) {
        freelancer = new Freelancer(event.params.freelancer.toHexString())
        freelancer.totalStars = BigInt.fromI32(0)
        freelancer.totalJobsReviewed = BigInt.fromI32(0)
        freelancer.averageRating = 0
        freelancer.save()
    }
    job.freelancerLookup = freelancer.id

    // Default values for other fields in schema
    job.freelancerStake = BigInt.fromI32(0)
    job.milestoneCount = 0
    job.categoryId = 0
    job.ipfsHash = ""
    job.token = Bytes.fromHexString("0x0000000000000000000000000000000000000000")

    job.save()

    // Global Stats
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

export function handleJobApplied(event: JobApplied): void {
    let application = new Application(event.params.jobId.toString() + "-" + event.params.freelancer.toHexString())
    application.job = event.params.jobId.toString()

    let freelancer = Freelancer.load(event.params.freelancer.toHexString())
    if (!freelancer) {
        freelancer = new Freelancer(event.params.freelancer.toHexString())
        freelancer.totalStars = BigInt.fromI32(0)
        freelancer.totalJobsReviewed = BigInt.fromI32(0)
        freelancer.averageRating = 0
        freelancer.save()
    }
    application.freelancer = freelancer.id
    application.stake = event.params.stake
    application.createdAt = event.block.timestamp
    application.save()
}

export function handleFreelancerPicked(event: FreelancerPicked): void {
    let job = Job.load(event.params.jobId.toString())
    if (job) {
        job.freelancer = event.params.freelancer
        job.freelancerLookup = event.params.freelancer.toHexString()
        job.status = "Accepted"
        job.updatedAt = event.block.timestamp
        job.save()
    }
}

export function handleJobAccepted(event: JobAccepted): void {
    let job = Job.load(event.params.jobId.toString())
    if (job) {
        job.status = "Ongoing"
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

export function handleMilestoneReleased(event: MilestoneReleased): void {
    let milestone = Milestone.load(event.params.jobId.toString() + "-" + event.params.milestoneId.toString())
    if (milestone) {
        milestone.isReleased = true
        milestone.save()
    }

    let job = Job.load(event.params.jobId.toString())
    if (job) {
        job.totalPaidOut = job.totalPaidOut.plus(event.params.amount)
        job.updatedAt = event.block.timestamp
        job.save()
    }
}

export function handleDisputeRaised(event: DisputeRaised): void {
    let job = Job.load(event.params.jobId.toString())
    if (job) {
        job.status = "Disputed"
        job.updatedAt = event.block.timestamp
        job.save()
    }

    let mapping = new DisputeMapping(event.params.disputeId.toString())
    mapping.jobId = event.params.jobId
    mapping.save()
}

export function handleDispute(event: Dispute): void {
    // This event is emitted by the Arbitrable contract (FreelanceEscrow)
    // and links the disputeID to the jobId via the metaEvidenceID or similar.
    // In our contract, jobId is encoded in the events.
}

export function handleEvidence(event: Evidence): void {
    let evidence = new EvidenceEntity(event.transaction.hash.toHexString())
    evidence.job = event.params._evidenceID.toString()
    evidence.submitter = event.params._party
    evidence.evidenceHash = event.params._evidence
    evidence.timestamp = event.block.timestamp
    evidence.save()
}

export function handleRuling(event: Ruling): void {
    let mapping = DisputeMapping.load(event.params._disputeID.toString())
    if (mapping) {
        let job = Job.load(mapping.jobId.toString())
        if (job) {
            if (event.params._ruling == BigInt.fromI32(1)) {
                job.status = "Cancelled"
            } else if (event.params._ruling == BigInt.fromI32(2)) {
                job.status = "Ongoing"
            } else if (event.params._ruling == BigInt.fromI32(3)) {
                job.status = "Completed"
            }
            job.updatedAt = event.block.timestamp
            job.save()
        }
    }
}
export function handleReviewSubmitted(event: ReviewSubmitted): void {
    let job = Job.load(event.params.jobId.toString())
    if (job) {
        let review = new Review(event.params.jobId.toString())
        review.job = job.id
        review.reviewer = event.params.client
        review.freelancer = job.freelancerLookup!
        review.rating = event.params.rating
        review.ipfsHash = event.params.review
        review.createdAt = event.block.timestamp
        review.save()

        job.rating = event.params.rating
        job.save()
    }
}

export function handleRatingUpdated(event: RatingUpdated): void {
    let freelancer = Freelancer.load(event.params.freelancer.toHexString())
    if (!freelancer) {
        freelancer = new Freelancer(event.params.freelancer.toHexString())
    }
    freelancer.averageRating = event.params.averageRating
    freelancer.totalStars = event.params.totalJobs.times(BigInt.fromI32(event.params.averageRating)) // Approximation or we can track totalStars properly
    freelancer.totalJobsReviewed = event.params.totalJobs
    freelancer.save()
}

export function handlePortfolioUpdated(event: PortfolioUpdated): void {
    let freelancer = Freelancer.load(event.params.freelancer.toHexString())
    if (!freelancer) {
        freelancer = new Freelancer(event.params.freelancer.toHexString())
        freelancer.totalStars = BigInt.fromI32(0)
        freelancer.totalJobsReviewed = BigInt.fromI32(0)
        freelancer.averageRating = 0
    }
    freelancer.portfolioCID = event.params.cid
    freelancer.save()
}
