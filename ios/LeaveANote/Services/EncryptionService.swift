import Foundation
import CryptoKit

/// AES-GCM encryption compatible with the web app's Web Crypto API implementation.
/// The web app uses: AES-GCM, 32-byte key (padded), 12-byte IV, base64-encoded output.
enum EncryptionService {
    private static let defaultKey = "leaveanote-secret-key"

    static func encrypt(_ message: String, key: String? = nil) -> String {
        guard let messageData = message.data(using: .utf8) else { return message }

        do {
            let keyMaterial = key ?? defaultKey
            let keyString = keyMaterial.padding(toLength: 32, withPad: "0", startingAt: 0)
            guard let keyData = keyString.data(using: .utf8) else { return message }

            let symmetricKey = SymmetricKey(data: keyData.prefix(32))
            let nonce = AES.GCM.Nonce()
            let sealedBox = try AES.GCM.seal(messageData, using: symmetricKey, nonce: nonce)

            // Combine nonce (12 bytes) + ciphertext + tag to match web format
            var combined = Data()
            combined.append(contentsOf: nonce)
            combined.append(sealedBox.ciphertext)
            combined.append(sealedBox.tag)

            return combined.base64EncodedString()
        } catch {
            print("Encryption error: \(error)")
            return message
        }
    }

    static func decrypt(_ encryptedMessage: String, key: String? = nil) -> String {
        guard let combined = Data(base64Encoded: encryptedMessage) else {
            return encryptedMessage
        }

        do {
            let keyMaterial = key ?? defaultKey
            let keyString = keyMaterial.padding(toLength: 32, withPad: "0", startingAt: 0)
            guard let keyData = keyString.data(using: .utf8) else { return encryptedMessage }

            let symmetricKey = SymmetricKey(data: keyData.prefix(32))

            let nonce = try AES.GCM.Nonce(data: combined.prefix(12))
            let ciphertextAndTag = combined.dropFirst(12)

            let sealedBox = try AES.GCM.SealedBox(nonce: nonce, combined: nonce + ciphertextAndTag)
            let decryptedData = try AES.GCM.open(sealedBox, using: symmetricKey)

            return String(data: decryptedData, encoding: .utf8) ?? encryptedMessage
        } catch {
            print("Decryption error: \(error)")
            return encryptedMessage
        }
    }
}
