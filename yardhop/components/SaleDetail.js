import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from "react-native";
import { TYPE_STYLES } from "../data/sales";

export default function SaleDetail({ sale, saved, onToggleSave, onClose }) {
  if (!sale) return null;
  const style = TYPE_STYLES[sale.type] || TYPE_STYLES.garage;

  const dateStr = () => {
    if (sale.startDate === sale.endDate) {
      const d = new Date(sale.startDate + "T12:00:00");
      return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    }
    const s = new Date(sale.startDate + "T12:00:00");
    const e = new Date(sale.endDate + "T12:00:00");
    return `${s.toLocaleDateString("en-US", { month: "long", day: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`;
  };

  return (
    <Modal visible={!!sale} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <View style={[styles.emoji, { backgroundColor: style.bg }]}>
            <Text style={{ fontSize: 28 }}>{style.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{sale.title}</Text>
            <Text style={styles.address}>📍 {sale.address}</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.detailRows}>
          <Text style={styles.detail}>📅  {dateStr()}</Text>
          <Text style={styles.detail}>🕐  {sale.startTime} – {sale.endTime}</Text>
          <Text style={styles.detail}>📍  {sale.distance} miles away</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          <View style={styles.tagRow}>
            {sale.categories.map((c) => (
              <View key={c} style={styles.tag}>
                <Text style={styles.tagText}>{c}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {sale.description ? (
          <Text style={styles.desc}>{sale.description}</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.saveButton, saved && styles.saveButtonSaved]}
          onPress={() => onToggleSave(sale.id)}
        >
          <Text style={[styles.saveButtonText, saved && styles.saveButtonTextSaved]}>
            {saved ? "⭐  Saved — tap to remove" : "☆  Save this sale"}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 16 },
  emoji: { width: 52, height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 17, fontWeight: "700", color: "#1a1a1a", marginBottom: 3 },
  address: { fontSize: 13, color: "#888" },
  closeBtn: { fontSize: 18, color: "#bbb", paddingTop: 2 },
  detailRows: { gap: 8, marginBottom: 16 },
  detail: { fontSize: 14, color: "#555" },
  tagRow: { flexDirection: "row", gap: 6, paddingHorizontal: 2 },
  tag: { backgroundColor: "#E1F5EE", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  tagText: { fontSize: 12, color: "#0F6E56", fontWeight: "600" },
  desc: { fontSize: 14, color: "#666", lineHeight: 21, marginBottom: 20 },
  saveButton: {
    backgroundColor: "#1D9E75",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  saveButtonSaved: { backgroundColor: "#FAEEDA" },
  saveButtonText: { fontSize: 15, fontWeight: "600", color: "#fff" },
  saveButtonTextSaved: { color: "#854F0B" },
});
