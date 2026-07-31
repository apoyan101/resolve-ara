import UIKit

final class TicketListViewController: UITableViewController {

    private let cellReuseIdentifier = "TicketCell"
    private let apiService = TicketAPIService.shared
    private var tickets: [Ticket] = MockData.tickets

    override func viewDidLoad() {
        super.viewDidLoad()
        title = "Tickets"
        tableView.register(UITableViewCell.self, forCellReuseIdentifier: cellReuseIdentifier)

        refreshControl = UIRefreshControl()
        refreshControl?.addTarget(self, action: #selector(handleRefresh), for: .valueChanged)
    }

    @objc private func handleRefresh() {
        Task {
            await loadTickets()
            refreshControl?.endRefreshing()
        }
    }

    /// Tries to load tickets from the live API; keeps whatever's already on
    /// screen (starting with `MockData.tickets`) if no backend is reachable.
    private func loadTickets() async {
        do {
            tickets = try await apiService.fetchTickets()
            tableView.reloadData()
        } catch {
            print("Failed to fetch tickets from API, keeping current data: \(error)")
        }
    }

    // MARK: - UITableViewDataSource

    override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        tickets.count
    }

    override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: cellReuseIdentifier, for: indexPath)
        let ticket = tickets[indexPath.row]

        var content = cell.defaultContentConfiguration()
        content.text = ticket.subject
        content.secondaryText = "\(ticket.status.displayName) · \(ticket.priority.displayName)"
        cell.contentConfiguration = content
        cell.accessoryType = .disclosureIndicator

        return cell
    }

    // MARK: - UITableViewDelegate

    override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        performSegue(withIdentifier: "showTicketDetail", sender: tickets[indexPath.row])
    }

    override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
        guard segue.identifier == "showTicketDetail",
              let detailViewController = segue.destination as? TicketDetailViewController,
              let ticket = sender as? Ticket else { return }
        detailViewController.ticket = ticket
    }
}
