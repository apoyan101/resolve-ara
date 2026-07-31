import Foundation

enum APIError: Error {
    case invalidURL
    case invalidResponse
    case serverError(statusCode: Int, message: String?)
    case decodingFailed(Error)
}

/// Talks to the support ticket REST API.
final class TicketAPIService {
    static let shared = TicketAPIService()

    private let baseURL: URL
    private let session: URLSession
    private let decoder: JSONDecoder

    init(baseURL: URL = URL(string: "http://3.89.116.245:3000")!, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        self.decoder = decoder
    }

    /// Fetch all tickets, optionally filtered by status/priority.
    func fetchTickets(status: TicketStatus? = nil, priority: TicketPriority? = nil) async throws -> [Ticket] {
        var components = URLComponents(url: baseURL.appendingPathComponent("tickets"), resolvingAgainstBaseURL: false)
        var queryItems: [URLQueryItem] = []
        if let status {
            queryItems.append(URLQueryItem(name: "status", value: status.rawValue))
        }
        if let priority {
            queryItems.append(URLQueryItem(name: "priority", value: priority.rawValue))
        }
        components?.queryItems = queryItems.isEmpty ? nil : queryItems

        guard let url = components?.url else { throw APIError.invalidURL }
        return try await get([Ticket].self, url: url)
    }

    /// Fetch a single ticket, including its comments.
    func fetchTicket(id: String) async throws -> Ticket {
        let url = baseURL.appendingPathComponent("tickets/\(id)")
        return try await get(Ticket.self, url: url)
    }

    private func get<T: Decodable>(_ type: T.Type, url: URL) async throws -> T {
        var request = URLRequest(url: url)
        request.httpMethod = "GET"

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        guard (200..<300).contains(httpResponse.statusCode) else {
            throw APIError.serverError(statusCode: httpResponse.statusCode, message: String(data: data, encoding: .utf8))
        }

        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decodingFailed(error)
        }
    }
}
