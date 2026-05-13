import SwiftUI

struct MediaGalleryView: View {
    let urls: [String]
    @State private var selectedURL: String?

    private let columns = [
        GridItem(.flexible(), spacing: 8),
        GridItem(.flexible(), spacing: 8),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Attachments")
                .font(.headline)

            LazyVGrid(columns: columns, spacing: 8) {
                ForEach(urls, id: \.self) { url in
                    AsyncImage(url: URL(string: url)) { phase in
                        switch phase {
                        case .success(let image):
                            image
                                .resizable()
                                .scaledToFill()
                                .frame(height: 150)
                                .clipped()
                                .cornerRadius(10)
                                .onTapGesture { selectedURL = url }
                        case .failure:
                            placeholder(systemName: "photo", text: "Failed to load")
                        case .empty:
                            ProgressView()
                                .frame(height: 150)
                        @unknown default:
                            EmptyView()
                        }
                    }
                }
            }
        }
        .fullScreenCover(item: Binding(
            get: { selectedURL.map { IdentifiableString(value: $0) } },
            set: { selectedURL = $0?.value }
        )) { item in
            lightbox(url: item.value)
        }
    }

    private func placeholder(systemName: String, text: String) -> some View {
        VStack {
            Image(systemName: systemName)
                .font(.title)
                .foregroundColor(.secondary)
            Text(text)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(height: 150)
        .frame(maxWidth: .infinity)
        .background(Color(.systemGray5))
        .cornerRadius(10)
    }

    private func lightbox(url: String) -> some View {
        ZStack(alignment: .topTrailing) {
            Color.black.ignoresSafeArea()

            AsyncImage(url: URL(string: url)) { phase in
                if case .success(let image) = phase {
                    image
                        .resizable()
                        .scaledToFit()
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            Button {
                selectedURL = nil
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .font(.title)
                    .foregroundColor(.white)
            }
            .padding()
        }
    }
}

private struct IdentifiableString: Identifiable {
    let id = UUID()
    let value: String
}
