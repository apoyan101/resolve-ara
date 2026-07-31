import Foundation

struct Comment: Codable, Identifiable {
    let id: String
    var ticketId: String
    var author: String
    var body: String
    var internalOnly: Bool
    var createdAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case ticketId
        case author
        case body
        case internalOnly = "internal"
        case createdAt
    }
}
