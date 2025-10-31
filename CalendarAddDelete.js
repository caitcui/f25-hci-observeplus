import React, { useState } from "react";
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, Alert } from "react-native";
import { Calendar } from "react-native-calendars";


export default function App() {
 const [selectedDate, setSelectedDate] = useState("");
 const [appointments, setAppointments] = useState({});
 const [newAppt, setNewAppt] = useState("");


 const addAppointment = () => {
   if (!newAppt.trim() || !selectedDate) return;


   setAppointments((prev) => ({
     ...prev,
     [selectedDate]: [...(prev[selectedDate] || []), newAppt],
   }));
   setNewAppt("");
 };


 const deleteAppointment = (date, index) => {
   Alert.alert("Delete Appointment", "Are you sure you want to delete this?", [
     { text: "Cancel" },
     {
       text: "Delete",
       onPress: () => {
         setAppointments((prev) => {
           const updated = [...prev[date]];
           updated.splice(index, 1);
           return { ...prev, [date]: updated };
         });
       },
     },
   ]);
 };


 const markedDates = Object.keys(appointments).reduce((acc, date) => {
   acc[date] = { marked: true, dotColor: "#32a852" };
   return acc;
 }, {});


 return (
   <View style={{ flex: 1, padding: 20, backgroundColor: "#fff" }}>
     <Text style={{ fontSize: 24, fontWeight: "600", marginBottom: 10 }}>My Calendar</Text>


     <Calendar
       onDayPress={(day) => setSelectedDate(day.dateString)}
       markedDates={{
         ...markedDates,
         [selectedDate]: { selected: true, selectedColor: "#32a852" },
       }}
     />


     {selectedDate ? (
       <View style={{ marginTop: 20 }}>
         <Text style={{ fontSize: 18, fontWeight: "500" }}>
           Appointments on {selectedDate}:
         </Text>


         <FlatList
           data={appointments[selectedDate] || []}
           keyExtractor={(_, i) => i.toString()}
           renderItem={({ item, index }) => (
             <TouchableOpacity
               onPress={() => deleteAppointment(selectedDate, index)}
               style={{
                 backgroundColor: "#e8f5e9",
                 padding: 10,
                 marginVertical: 4,
                 borderRadius: 8,
               }}
             >
               <Text>{item}</Text>
               <Text style={{ color: "red", fontSize: 12 }}>Tap to delete</Text>
             </TouchableOpacity>
           )}
         />


         <TextInput
           placeholder="Add new appointment..."
           value={newAppt}
           onChangeText={setNewAppt}
           style={{
             borderWidth: 1,
             borderColor: "#ccc",
             borderRadius: 8,
             padding: 8,
             marginTop: 10,
           }}
         />


         <Button title="Add Appointment" color="#32a852" onPress={addAppointment} />
       </View>
     ) : (
       <Text style={{ marginTop: 20 }}>Select a date to view or add appointments.</Text>
     )}
   </View>
 );
}
