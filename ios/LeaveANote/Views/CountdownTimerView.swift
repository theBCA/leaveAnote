import SwiftUI

struct CountdownTimerView: View {
    let countdown: CountdownTime
    let timezone: String

    var body: some View {
        if countdown.isExpired { EmptyView() }
        else {
            VStack(spacing: 16) {
                Text("Time Until Reveal")
                    .font(.title3.weight(.bold))

                HStack(spacing: 10) {
                    timeUnit(value: countdown.days, label: "Days", color: .indigo)
                    timeUnit(value: countdown.hours, label: "Hours", color: .purple)
                    timeUnit(value: countdown.minutes, label: "Min", color: .pink)
                    timeUnit(value: countdown.seconds, label: "Sec", color: .blue)
                }

                Text("Timezone: \(timezone)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }

    private func timeUnit(value: Int, label: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(String(format: "%02d", value))
                .font(.system(size: 32, weight: .bold, design: .rounded))
                .foregroundColor(color)
            Text(label)
                .font(.caption2.weight(.semibold))
                .foregroundColor(.secondary)
                .textCase(.uppercase)
        }
        .frame(minWidth: 70)
        .padding(.vertical, 12)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 8, y: 2)
    }
}
