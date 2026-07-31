import UIKit

final class TicketDetailViewController: UIViewController {

    var ticket: Ticket?

    private let scrollView = UIScrollView()
    private let stackView: UIStackView = {
        let stack = UIStackView()
        stack.axis = .vertical
        stack.spacing = 16
        stack.alignment = .fill
        return stack
    }()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        title = ticket?.subject ?? "Ticket"
        setUpLayout()
        populate()
    }

    private func setUpLayout() {
        scrollView.translatesAutoresizingMaskIntoConstraints = false
        stackView.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(scrollView)
        scrollView.addSubview(stackView)

        NSLayoutConstraint.activate([
            scrollView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            scrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scrollView.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            stackView.topAnchor.constraint(equalTo: scrollView.topAnchor, constant: 20),
            stackView.leadingAnchor.constraint(equalTo: scrollView.leadingAnchor, constant: 20),
            stackView.trailingAnchor.constraint(equalTo: scrollView.trailingAnchor, constant: -20),
            stackView.bottomAnchor.constraint(equalTo: scrollView.bottomAnchor, constant: -20),
            stackView.widthAnchor.constraint(equalTo: scrollView.widthAnchor, constant: -40),
        ])
    }

    private func populate() {
        guard let ticket else { return }

        stackView.addArrangedSubview(makeLabel(ticket.subject, style: .title2, weight: .bold))
        stackView.addArrangedSubview(makeLabel(
            "\(ticket.status.displayName) · \(ticket.priority.displayName) priority",
            style: .subheadline,
            color: .secondaryLabel
        ))
        stackView.addArrangedSubview(makeLabel("From \(ticket.customerEmail)", style: .footnote, color: .secondaryLabel))
        stackView.addArrangedSubview(makeDivider())
        stackView.addArrangedSubview(makeLabel(ticket.description, style: .body))

        if !ticket.comments.isEmpty {
            stackView.addArrangedSubview(makeDivider())
            stackView.addArrangedSubview(makeLabel("Comments", style: .headline))
            for comment in ticket.comments {
                stackView.addArrangedSubview(makeCommentView(comment))
            }
        }
    }

    private func makeLabel(
        _ text: String,
        style: UIFont.TextStyle,
        weight: UIFont.Weight? = nil,
        color: UIColor = .label
    ) -> UILabel {
        let label = UILabel()
        label.text = text
        label.textColor = color
        label.numberOfLines = 0
        let baseFont = UIFont.preferredFont(forTextStyle: style)
        label.font = weight.map { UIFont.systemFont(ofSize: baseFont.pointSize, weight: $0) } ?? baseFont
        return label
    }

    private func makeDivider() -> UIView {
        let divider = UIView()
        divider.backgroundColor = .separator
        divider.heightAnchor.constraint(equalToConstant: 1).isActive = true
        return divider
    }

    private func makeCommentView(_ comment: Comment) -> UIView {
        let container = UIStackView()
        container.axis = .vertical
        container.spacing = 4

        let author = comment.author + (comment.internalOnly ? " (internal)" : "")
        container.addArrangedSubview(makeLabel(author, style: .footnote, weight: .semibold, color: .secondaryLabel))
        container.addArrangedSubview(makeLabel(comment.body, style: .body))

        return container
    }
}
