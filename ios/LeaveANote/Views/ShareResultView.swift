import SwiftUI
import CoreImage.CIFilterBuiltins

struct ShareResultView: View {
    let links: ShareLinks
    let onDone: () -> Void

    @State private var recipientCopied = false
    @State private var senderCopied = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 56))
                        .foregroundColor(.green)

                    Text("Note Created!")
                        .font(.title.weight(.bold))
                    Text("Share this note with your recipient")
                        .foregroundColor(.secondary)

                    if let qr = generateQRCode(from: links.recipientLink) {
                        Image(uiImage: qr)
                            .interpolation(.none)
                            .resizable()
                            .scaledToFit()
                            .frame(height: 200)
                            .padding()
                            .background(Color(.systemBackground))
                            .cornerRadius(16)
                            .shadow(color: .black.opacity(0.08), radius: 12, y: 2)
                    }

                    linkSection(
                        title: "Share Link (for recipient)",
                        link: links.recipientLink,
                        copied: recipientCopied
                    ) {
                        UIPasteboard.general.string = links.recipientLink
                        recipientCopied = true
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2) { recipientCopied = false }
                    }

                    linkSection(
                        title: "Your Control Link (save this!)",
                        link: links.senderLink,
                        copied: senderCopied
                    ) {
                        UIPasteboard.general.string = links.senderLink
                        senderCopied = true
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2) { senderCopied = false }
                    }

                    Text("Keep the control link to manage your note (edit or cancel before reveal)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)

                    HStack(spacing: 12) {
                        ShareLink(item: URL(string: links.recipientLink)!) {
                            Text("Share")
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.indigo)

                        Button {
                            dismiss()
                            onDone()
                        } label: {
                            Text("Done")
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                        }
                        .buttonStyle(.bordered)
                    }
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Note Created")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private func linkSection(title: String, link: String, copied: Bool, action: @escaping () -> Void) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.subheadline.weight(.semibold))
            HStack {
                Text(link)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(1)
                    .truncationMode(.middle)
                Spacer()
                Button(copied ? "Copied!" : "Copy", action: action)
                    .buttonStyle(.borderedProminent)
                    .tint(copied ? .green : .indigo)
                    .controlSize(.small)
            }
            .padding(10)
            .background(Color(.systemBackground))
            .cornerRadius(10)
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color(.separator)))
        }
    }

    private func generateQRCode(from string: String) -> UIImage? {
        let context = CIContext()
        let filter = CIFilter.qrCodeGenerator()
        filter.message = Data(string.utf8)
        filter.correctionLevel = "H"
        guard let output = filter.outputImage else { return nil }
        let scaled = output.transformed(by: CGAffineTransform(scaleX: 10, y: 10))
        guard let cgImage = context.createCGImage(scaled, from: scaled.extent) else { return nil }
        return UIImage(cgImage: cgImage)
    }
}
