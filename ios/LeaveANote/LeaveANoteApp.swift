import SwiftUI
import FirebaseCore

@main
struct LeaveANoteApp: App {
    init() {
        FirebaseApp.configure()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
