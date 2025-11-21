import React, { useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";


export default function App() {
 const [open, setOpen] = useState(false);
 const [value, setValue] = useState(null);
 const [items, setItems] = useState(
   Array.from({ length: 20 }, (_, i) => ({ label: `${i + 1}`, value: i + 1 }))
 );


 return (
   <View style={styles.container}>
     <Text style={styles.label}>Select a Number:</Text>
     <DropDownPicker
       open={open}
       value={value}
       items={items}
       setOpen={setOpen}
       setValue={setValue}
       setItems={setItems}
       searchable={true} 
       searchPlaceholder="Type to search..."
       containerStyle={{ width: 200 }}
     />
     {value !== null && <Text style={styles.selected}>Selected: {value}</Text>}
   </View>
 );
}


const styles = StyleSheet.create({
 container: {
   flex: 1,
   justifyContent: "center",
   alignItems: "center",
   padding: 20,
 },
 label: {
   fontSize: 20,
   marginBottom: 10,
 },
 selected: {
   marginTop: 20,
   fontSize: 18,
   color: "#555",
 },
});


