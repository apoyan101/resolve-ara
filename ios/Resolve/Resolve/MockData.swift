import Foundation

/// Canned tickets so the list/detail screens have something to show
/// without a live backend to talk to.
enum MockData {
    static let tickets: [Ticket] = [
        Ticket(
            id: "1",
            subject: "Cannot log in to my account",
            description: "I get a 500 error every time I try to log in from the iOS app.",
            customerEmail: "alice@example.com",
            status: .open,
            priority: .high,
            comments: [
                Comment(
                    id: "c1",
                    ticketId: "1",
                    author: "support-agent",
                    body: "Looking into this now.",
                    internalOnly: false,
                    createdAt: Date().addingTimeInterval(-3000)
                ),
            ],
            createdAt: Date().addingTimeInterval(-86_400),
            updatedAt: Date().addingTimeInterval(-3000)
        ),
        Ticket(
            id: "2",
            subject: "Feature request: dark mode",
            description: "Would love a dark mode option in settings.",
            customerEmail: "bob@example.com",
            status: .new,
            priority: .normal,
            comments: [],
            createdAt: Date().addingTimeInterval(-3600),
            updatedAt: Date().addingTimeInterval(-3600)
        ),
        Ticket(
            id: "3",
            subject: "Billing charged twice",
            description: "I was charged twice for my subscription this month.",
            customerEmail: "carol@example.com",
            status: .inProgress,
            priority: .urgent,
            comments: [
                Comment(
                    id: "c2",
                    ticketId: "3",
                    author: "carol",
                    body: "Please refund ASAP.",
                    internalOnly: false,
                    createdAt: Date().addingTimeInterval(-7000)
                ),
                Comment(
                    id: "c3",
                    ticketId: "3",
                    author: "support-agent",
                    body: "Escalated to billing team.",
                    internalOnly: true,
                    createdAt: Date().addingTimeInterval(-1800)
                ),
            ],
            createdAt: Date().addingTimeInterval(-7200),
            updatedAt: Date().addingTimeInterval(-1800)
        ),
        Ticket(
            id: "4",
            subject: "Password reset email never arrives",
            description: "Requested a password reset three times, nothing in inbox or spam.",
            customerEmail: "dave@example.com",
            status: .waitingCustomer,
            priority: .normal,
            comments: [],
            createdAt: Date().addingTimeInterval(-10_000),
            updatedAt: Date().addingTimeInterval(-500)
        ),
        Ticket(
            id: "5",
            subject: "Export to CSV is broken",
            description: "The export button does nothing when clicked.",
            customerEmail: "erin@example.com",
            status: .resolved,
            priority: .low,
            comments: [],
            createdAt: Date().addingTimeInterval(-200_000),
            updatedAt: Date().addingTimeInterval(-100_000)
        ),
    ]
}
