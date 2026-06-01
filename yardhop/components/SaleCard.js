import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { TYPE_STYLES } from "../data/sales";

const today = new Date().toISOString().split("T")[0];

export default function SaleCard({ sale, saved, onToggleSave, onPress }) {
  const style = TYPE_STYLES[sale.type] || TYPE_STYLES.garage;
  const isToday = sale.startDate === today;

  const dateLabel = () => {
    if (isToday) return "Today";
    if (sale.startDate === sale.endDate) {
      const d = new Date(sale.startDate + "T12:00:00");
      return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    }
    const s = new Date(sale.startDate + "T12:00:00");
    const e = new Date(sale.endDate + "T12:00:00");
    return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.getDate()}`;
  };

  const badgeBg = isToday ? "#EEEDFE" : "#E1F5EE";
  const badgeColor = isToday ? "#3C3489" : "#0F6E56";

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress && onPress(sale)} activeOpacity={0.7}>
      <View style={[styles.icon, { backgroundColor: style.bg }]}>
        <Text style={{ fontSize: 20 }}>{style.emoji}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{sale.title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>📅 {dateLabel()}</Text>
          <Text style={styles.meta}>  🕐 {sale.startTime}</Text>
          <Text style={styles.meta}>  📍 {sale.distance} mi</Text>
        </View>
        <Text style={styles.cats} numberOfLines={1}>{sale.categories.join(" · ")}</Text>
      </View>

      <View style={styles.actions}>
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>{dateLabel()}</Text>
        </View>
        <TouchableOpacity
          style={[styles.saveBtn, saved && styles.saveBtnActive]}
          onPress={() => onToggleSave(sale.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ fontSize: 16 }}>{saved ? "⭐" : "☆"}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#e5e3da",
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: "600", color: "#1a1a1a", marginBottom: 3 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 3 },
  meta: { fontSize: 11, color: "#999" },
  cats: { fontSize: 11, color: "#bbb" },
  actions: { alignItems: "flex-end", gap: 6 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { fontSize: 10, fontWeight: "600" },
  saveBtn: {
    padding: 4,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "#e5e3da",
    backgroundColor: "#fff",
  },
  saveBtnActive: {
    backgroundColor: "#FAEEDA",
    borderColor: "#BA7517",
  },
});
