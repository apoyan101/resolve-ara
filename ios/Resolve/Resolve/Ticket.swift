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

extension Ticket {
    private enum CodingKeys: String, CodingKey {
        case id, subject, description, customerEmail, status, priority, comments, createdAt, updatedAt
    }

    // The list endpoint (GET /tickets) omits `comments` since it doesn't load
    // that relation; only the single-ticket endpoint includes it. Default to
    // an empty array when the key is absent instead of failing to decode.
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        subject = try container.decode(String.self, forKey: .subject)
        description = try container.decode(String.self, forKey: .description)
        customerEmail = try container.decode(String.self, forKey: .customerEmail)
        status = try container.decode(TicketStatus.self, forKey: .status)
        priority = try container.decode(TicketPriority.self, forKey: .priority)
        comments = try container.decodeIfPresent([Comment].self, forKey: .comments) ?? []
        createdAt = try container.decodeIfPresent(Date.self, forKey: .createdAt)
        updatedAt = try container.decodeIfPresent(Date.self, forKey: .updatedAt)
    }
}
