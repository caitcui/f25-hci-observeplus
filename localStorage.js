import React, { useState, useEffect } from "react";
import { View, TextInput, Text, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";


export default function App() {
 const [text, setText] = useState("");
 const [saving, setSaving] = useState(false);


 useEffect(() => {
   const loadText = async () => {
     try {
       const saved = await AsyncStorage.getItem("autosave-text");
       if (saved) setText(saved);
     } catch (e) {
       console.log("Error loading text", e);
     }
   };
   loadText();
 }, []);


 useEffect(() => {
   const timer = setTimeout(async () => {
     try {
       await AsyncStorage.setItem("autosave-text", text);
       setSaving(true);
       setTimeout(() => setSaving(false), 3000);
     } catch (e) {
       console.log("Error saving text", e);
     }
   }, 2000);


   return () => clearTimeout(timer);
 }, [text]);


 return (
   <View style={styles.container}>
     <Text style={styles.saveText}>{saving ? "Saved!" : "Autosave On"}</Text>
     <TextInput
       style={styles.input}
       multiline
       value={text}
       onChangeText={setText}
     />
   </View>
 );
}


const styles = StyleSheet.create({
 container: {
   flex: 1,
   padding: 20,
   justifyContent: "flex-start",
   marginTop: 60,
 },
 saveText: {
   fontSize: 20,
   marginBottom: 10,
   textAlign: "center",
   color: "#555",
 },
 input: {
   borderWidth: 1,
   borderColor: "#ccc",
   borderRadius: 8,
   padding: 10,
   fontSize: 16,
   height: 150,
   textAlignVertical: "top",
 },
});
