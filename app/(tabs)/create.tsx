import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { createPoll } from "../../lib/firestore";
import { PollSchema } from "../../lib/validation";

const DURATION_OPTIONS = [
  { label: "30 mins", minutes: 30 },
  { label: "2 hours", minutes: 120 },
  { label: "1 day", minutes: 1440 },
];

export default function CreateScreen() {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [duration, setDuration] = useState(1440); // default 1 day
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addOption() {
    if (options.length < 4) setOptions([...options, ""]);
  }

  function removeOption(index: number) {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index));
  }

  function updateOption(text: string, index: number) {
    const updated = [...options];
    updated[index] = text;
    setOptions(updated);
  }

  async function handleCreate() {
    setError("");

    const filledOptions = options.filter((o) => o.trim().length > 0);
    const result = PollSchema.safeParse({ question, options: filledOptions });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    if (!user) {
      setError("You must be logged in");
      return;
    }

    setLoading(true);
    try {
      const pollId = await createPoll(
        user.uid,
        user.displayName || "Anonymous",
        question,
        filledOptions,
        duration,
        allowMultiple,
      );

      // Reset form to defaults
      setQuestion("");
      setOptions(["", ""]);
      setDuration(1440);
      setAllowMultiple(false);

      router.push(`/poll/${pollId}`);
    } catch (err) {
      setError("Failed to create poll. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.title}>New Poll</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Question */}
        <Text style={styles.label}>Your Question</Text>
        <TextInput
          style={styles.questionInput}
          placeholder="Ask something..."
          placeholderTextColor="#71717a"
          value={question}
          onChangeText={setQuestion}
          multiline
          maxLength={150}
        />
        <Text style={styles.charCount}>{question.length}/150</Text>

        {/* Options */}
        <Text style={styles.label}>Options</Text>
        {options.map((option, index) => (
          <View key={index} style={styles.optionRow}>
            <TextInput
              style={styles.optionInput}
              placeholder={`Option ${index + 1}`}
              placeholderTextColor="#71717a"
              value={option}
              onChangeText={(text) => updateOption(text, index)}
              maxLength={60}
            />
            {options.length > 2 && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeOption(index)}
              >
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {options.length < 4 && (
          <TouchableOpacity style={styles.addButton} onPress={addOption}>
            <Text style={styles.addButtonText}>+ Add Option</Text>
          </TouchableOpacity>
        )}

        {/* Duration Selector */}
        <Text style={styles.label}>Poll Duration</Text>
        <View style={styles.durationRow}>
          {DURATION_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.minutes}
              style={[
                styles.durationChip,
                duration === opt.minutes && styles.durationChipActive,
              ]}
              onPress={() => setDuration(opt.minutes)}
            >
              <Text
                style={[
                  styles.durationText,
                  duration === opt.minutes && styles.durationTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Multiple Choice Toggle */}
        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleLabel}>Allow Multiple Answers</Text>
            <Text style={styles.toggleSubtext}>
              Voters can select more than one option
            </Text>
          </View>
          <Switch
            value={allowMultiple}
            onValueChange={setAllowMultiple}
            trackColor={{ false: "#27272a", true: "#4f46e5" }}
            thumbColor={allowMultiple ? "#6366f1" : "#71717a"}
          />
        </View>

        <TouchableOpacity
          style={[styles.createButton, loading && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Create Poll</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  inner: { padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: "bold", color: "#fff", marginBottom: 32 },
  label: {
    color: "#a1a1aa",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  questionInput: {
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 4,
  },
  charCount: {
    color: "#52525b",
    fontSize: 12,
    textAlign: "right",
    marginBottom: 24,
  },
  optionRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  optionInput: {
    flex: 1,
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 16,
  },
  removeButton: { marginLeft: 8, padding: 8 },
  removeText: { color: "#ef4444", fontSize: 18 },
  addButton: {
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginBottom: 24,
    borderStyle: "dashed",
  },
  addButtonText: { color: "#6366f1", fontSize: 15 },
  durationRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  durationChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  durationChipActive: { borderColor: "#6366f1", backgroundColor: "#1e1b4b" },
  durationText: { color: "#71717a", fontSize: 14, fontWeight: "600" },
  durationTextActive: { color: "#818cf8" },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  toggleLabel: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  toggleSubtext: { color: "#71717a", fontSize: 13 },
  createButton: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  createButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  error: { color: "#ef4444", textAlign: "center", marginBottom: 16 },
});
