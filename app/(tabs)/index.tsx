// app/(tabs)/index.tsx
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";
import { SchedulableTriggerInputTypes } from "expo-notifications"; // ✅ enum, lai nebūtu kļūdu ar 'type'
import React, { useMemo, useState } from "react";
import {
    FlatList,
    Modal,
    Platform,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from "react-native";

// ---------- LATVISKI KOMENTĀRI SĀKAS TE ----------
// Tēma:
// - Automātiska (pēc sistēmas) ar pārslēdzamu slēdzi (gaiša/tumša).
// - Krāsas: gaišā #f5f7fb, tumšā #0f1115. Teksts atbilstošs kontrastam.
//
// Paziņojumi (lokālie):
// - Expo Go neatbalsta attālinātos push (SDK 53+), bet lokālos var plānot.
// - Nelietojam getExpoPushTokenAsync u.c. funkcijas, lai izvairītos no Expo Go brīdinājuma.
// - Trigger tips izmanto oficiālo enum: SchedulableTriggerInputTypes.CALENDAR
//
// Laika izvēle (apaļais pulkstenis Android):
// - @react-native-community/datetimepicker ar display="clock", mode="time".
// - iOS rāda nativo time picker.
//
// Saraksts (FlatList):
// - Bez ielikšanas ScrollView iekšā, lai nebūtu VirtualizedList brīdinājuma.
// - renderItem ir obligāts, tipizēts.
// ---------- LATVISKI KOMENTĀRI BEIDZAS ----------

type Todo = {
  id: string;
  title: string;
  done: boolean;
};

const initialTodos: Todo[] = [
  { id: "1", title: "Nopirkt pienu", done: false },
  { id: "2", title: "Uzrakstīt plānu", done: true },
];

Notifications.setNotificationHandler({
  // LATVISKI: Notifikāciju uzvedība (lokālām paziņojumiem).
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    // iOS papildu lauki (SDK d.ts prasa):
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function HomeTab() {
  const systemScheme = useColorScheme();
  const [forceDark, setForceDark] = useState<boolean | null>(null); // LATVISKI: null = sistēmas režīms
  const theme = useMemo<"dark" | "light">(() => {
    if (forceDark === null) return systemScheme === "dark" ? "dark" : "light";
    return forceDark ? "dark" : "light";
  }, [forceDark, systemScheme]);

  const colors = useMemo(
    () =>
      theme === "dark"
        ? {
            bg: "#0f1115",
            card: "#171a21",
            text: "#e8ecf1",
            sub: "#9aa4b2",
            accent: "#4ea1ff",
            inputBg: "#1e232d",
            border: "#2a2f3a",
          }
        : {
            bg: "#f5f7fb",
            card: "#ffffff",
            text: "#0f1115",
            sub: "#4b5563",
            accent: "#0b74ff",
            inputBg: "#f0f3f9",
            border: "#e5e7eb",
          },
    [theme]
  );

  // LATVISKI: TODO saraksts
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [draft, setDraft] = useState("");

  // LATVISKI: laika izvēle + plānošana
  const [time, setTime] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const addTodo = () => {
    const title = draft.trim();
    if (!title) return;
    setTodos((prev) => [
      { id: String(Date.now()), title, done: false },
      ...prev,
    ]);
    setDraft("");
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const removeTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const renderItem = ({ item }: { item: Todo }) => (
    <View
      style={[
        styles.todoRow,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <TouchableOpacity onPress={() => toggleTodo(item.id)} style={styles.ck}>
        <View
          style={[
            styles.checkbox,
            {
              borderColor: item.done ? colors.accent : colors.border,
              backgroundColor: item.done ? colors.accent : "transparent",
            },
          ]}
        />
      </TouchableOpacity>
      <Text
        style={[
          styles.todoText,
          {
            color: colors.text,
            textDecorationLine: item.done ? "line-through" : "none",
            opacity: item.done ? 0.6 : 1,
          },
        ]}
        numberOfLines={2}
      >
        {item.title}
      </Text>
      <TouchableOpacity onPress={() => removeTodo(item.id)} style={styles.del}>
        <Text style={{ color: colors.sub }}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  // LATVISKI: plānot lokālu paziņojumu noteiktā laikā (katru dienu)
  const scheduleDaily = async () => {
    try {
      // Expo Go: tikai lokālie — OK
      const hour = time.getHours();
      const minute = time.getMinutes();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Atgādinājums",
          body: "Ir pienācis tavs ieplānotais laiks!",
        },
        trigger: {
          type: SchedulableTriggerInputTypes.CALENDAR,
          repeats: true,
          hour,
          minute,
        },
      });
      alert("Dienas paziņojums ieplānots.");
    } catch (err) {
      console.warn("scheduleDaily error:", err);
      alert(
        "Neizdevās ieplānot. Pārbaudi Expo Go ierobežojumus un mēģini Development Build."
      );
    }
  };

  // LATVISKI: vienreizējs paziņojums konkrētā datumā
  const scheduleOnce = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Atgādinājums (vienreiz)",
          body: time.toLocaleString(),
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date: time,
        },
      });
      alert("Vienreizējs paziņojums ieplānots.");
    } catch (err) {
      console.warn("scheduleOnce error:", err);
      alert("Neizdevās ieplānot vienreizēju paziņojumu.");
    }
  };

  // LATVISKI: UI
  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {/* Header karte */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.h1, { color: colors.text }]}>Project Todo</Text>

        <View style={styles.row}>
          <Text style={{ color: colors.sub, marginRight: 8 }}>Tēma</Text>
          <Text style={{ color: colors.sub, marginRight: 8 }}>
            {forceDark === null ? "Sistēma" : forceDark ? "Tumša" : "Gaiša"}
          </Text>
          <Switch
            value={forceDark === null ? theme === "dark" : forceDark}
            onValueChange={(v) => setForceDark(v)}
          />
          <TouchableOpacity
            onPress={() => setForceDark((prev) => (prev === null ? true : null))}
            style={{ marginLeft: 10 }}
          >
            <Text style={{ color: colors.accent }}>
              {forceDark === null ? "Atvienot no sistēmas" : "Saskaņot ar sistēmu"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Laika izvēle */}
        <View style={[styles.row, { marginTop: 12 }]}>
          <TouchableOpacity
            onPress={() => setShowPicker(true)}
            style={[
              styles.btn,
              { backgroundColor: colors.accent, borderColor: colors.accent },
            ]}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              Izvēlēties laiku
            </Text>
          </TouchableOpacity>

          <Text style={{ color: colors.text, marginLeft: 12 }}>
            {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>

        {/* Trigger pogas */}
        <View style={[styles.row, { marginTop: 12, flexWrap: "wrap" }]}>
          <TouchableOpacity
            onPress={scheduleDaily}
            style={[
              styles.btnGhost,
              { borderColor: colors.accent, marginRight: 8, marginBottom: 8 },
            ]}
          >
            <Text style={{ color: colors.accent }}>Katru dienu</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={scheduleOnce}
            style={[
              styles.btnGhost,
              { borderColor: colors.accent, marginRight: 8, marginBottom: 8 },
            ]}
          >
            <Text style={{ color: colors.accent }}>Vienreiz</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Jauna uzdevuma ievade */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.label, { color: colors.sub }]}>Jauns uzdevums</Text>
        <View style={styles.row}>
          <TextInput
            placeholder="Ko jādara?"
            placeholderTextColor={colors.sub}
            value={draft}
            onChangeText={setDraft}
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBg,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
          />
          <TouchableOpacity
            onPress={addTodo}
            style={[
              styles.btn,
              { backgroundColor: colors.accent, borderColor: colors.accent },
            ]}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Pievienot</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Todo saraksts */}
      <FlatList
        data={todos}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        ListHeaderComponent={
          <Text
            style={{
              color: colors.sub,
              marginBottom: 8,
              paddingHorizontal: 8,
            }}
          >
            Uzdevumi ({todos.length})
          </Text>
        }
      />

      {/* Laika picker — Android clock/iOS native */}
      {Platform.OS !== "web" && (
        <Modal visible={showPicker} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.modalCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.h2, { color: colors.text, marginBottom: 8 }]}>
                Izvēlies laiku
              </Text>
              <DateTimePicker
                value={time}
                mode="time"
                display={Platform.OS === "android" ? "clock" : "spinner"}
                is24Hour
                onChange={(_, selected) => {
                  if (selected) setTime(selected);
                }}
              />
              <View style={[styles.row, { marginTop: 12, justifyContent: "flex-end" }]}>
                <TouchableOpacity
                  onPress={() => setShowPicker(false)}
                  style={[styles.btnGhost, { borderColor: colors.accent, marginRight: 8 }]}
                >
                  <Text style={{ color: colors.accent }}>Aizvērt</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowPicker(false)}
                  style={[styles.btn, { backgroundColor: colors.accent, borderColor: colors.accent }]}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  card: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  h1: { fontSize: 22, fontWeight: "700" },
  h2: { fontSize: 18, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center" },
  label: { fontSize: 12, marginBottom: 8 },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  btn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  btnGhost: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  todoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  ck: { width: 28, height: 28, marginRight: 10, alignItems: "center", justifyContent: "center" },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 6,
  },
  todoText: { flex: 1, fontSize: 16, fontWeight: "500" },
  del: { paddingLeft: 10, paddingVertical: 8 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    width: "90%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
});
