import Foundation

enum TicketStatus: String, Codable, CaseIterable {
    case new
    case open
    case inProgress = "in_progress"
    case waitingCustomer = "waiting_customer"
    case resolved
    case closed

    var displayName: String {
        switch self {
        case .new: return "New"
        case .open: return "Open"
        case .inProgress: return "In Progress"
        case .waitingCustomer: return "Waiting on Customer"
        case .resolved: return "Resolved"
        case .closed: return "Closed"
        }
    }
}

enum TicketPriority: String, Codable, CaseIterable {
    case low
    case normal
    case high
    case urgent

    var displayName: String {
        rawValue.capitalized
    }
}

struct Ticket: Codable, Identifiable {
    let id: String
    var subject: String
    var description: String
    var customerEmail: String
    var status: TicketStatus
    var priority: TicketPriority
    var comments: [Comment]
    var createdAt: Date?
    var updatedAt: Date?
}
