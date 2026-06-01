import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native";
import { CATEGORIES } from "../data/sales";

export default function PostScreen({ onPost }) {
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("8:00 AM");
  const [endTime, setEndTime] = useState("2:00 PM");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const toggleTag = (t) => setTags((ts) => ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]);

  const handleSubmit = () => {
    if (!title || !address || !startDate) {
      Alert.alert("Missing info", "Please fill in title, address, and start date.");
      return;
    }
    onPost && onPost({ title, address, startDate, endDate: endDate || startDate, startTime, endTime, description, categories: tags });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <View style={styles.successWrap}>
        <Text style={{ fontSize: 56 }}>🎉</Text>
        <Text style={styles.successTitle}>Sale posted!</Text>
        <Text style={styles.successSub}>Your sale is live on the map. Neighbors can now discover and save it.</Text>
        <TouchableOpacity
          style={styles.postBtn}
          onPress={() => { setSubmitted(false); setTitle(""); setAddress(""); setStartDate(""); setEndDate(""); setDescription(""); setTags([]); }}
        >
          <Text style={styles.postBtnText}>Post another sale</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f5f4f0" }} contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <Text style={styles.sectionLabel}>Sale details</Text>

      <Text style={styles.label}>Sale title</Text>
      <TextInput style={styles.input} placeholder="e.g. Estate cleanout — moving soon" value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Address</Text>
      <TextInput style={styles.input} placeholder="Street address" value={address} onChangeText={setAddress} />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Start date</Text>
          <TextInput style={styles.input} placeholder="2026-05-30" value={startDate} onChangeText={setStartDate} />
        </View>
        <View style={{ width: 10 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>End date</Text>
          <TextInput style={styles.input} placeholder="2026-05-31" value={endDate} onChangeText={setEndDate} />
        </View>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Opens at</Text>
          <TextInput style={styles.input} placeholder="8:00 AM" value={startTime} onChangeText={setStartTime} />
        </View>
        <View style={{ width: 10 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Closes at</Text>
          <TextInput style={styles.input} placeholder="2:00 PM" value={endTime} onChangeText={setEndTime} />
        </View>
      </View>

      <Text style={styles.sectionLabel}>What you're selling</Text>

      <Text style={styles.label}>Categories</Text>
      <View style={styles.tagWrap}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => toggleTag(c)}
            style={[styles.tag, tags.includes(c) && styles.tagActive]}
          >
            <Text style={[styles.tagText, tags.includes(c) && styles.tagTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, { height: 80, textAlignVertical: "top" }]}
        placeholder="What's special about your sale? Highlights, parking notes, early birds welcome?"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <TouchableOpacity style={styles.postBtn} onPress={handleSubmit}>
        <Text style={styles.postBtnText}>✓  Post my sale</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 4 },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#aaa", textTransform: "uppercase", letterSpacing: 0.6, marginTop: 16, marginBottom: 8, borderTopWidth: 0.5, borderTopColor: "#e5e3da", paddingTop: 14 },
  label: { fontSize: 12, fontWeight: "600", color: "#888", marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: "#fff", borderWidth: 0.5, borderColor: "#e5e3da", borderRadius: 10, padding: 12, fontSize: 14, color: "#1a1a1a" },
  row: { flexDirection: "row" },
  tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 0.5, borderColor: "#e5e3da", backgroundColor: "#fff" },
  tagActive: { backgroundColor: "#E1F5EE", borderColor: "#1D9E75" },
  tagText: { fontSize: 13, color: "#888" },
  tagTextActive: { color: "#0F6E56", fontWeight: "600" },
  postBtn: { backgroundColor: "#1D9E75", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 20, marginBottom: 20 },
  postBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  successWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12, backgroundColor: "#f5f4f0" },
  successTitle: { fontSize: 22, fontWeight: "700", color: "#1a1a1a" },
  successSub: { fontSize: 14, color: "#888", textAlign: "center", lineHeight: 21 },
});
