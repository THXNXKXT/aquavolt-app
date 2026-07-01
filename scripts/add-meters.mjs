import fs from "fs";

const metersSection = {
  "meters": {
    "title": "Meter Readings",
    "recordMeter": "Record Meter",
    "editMeter": "Edit Meter Reading",
    "selectRoom": "Select Room",
    "month": "Month",
    "year": "Year",
    "water": "Water",
    "electric": "Electricity",
    "waterPrevious": "Previous Reading",
    "waterCurrent": "Current Reading",
    "waterUsage": "Usage (m³)",
    "electricPrevious": "Previous Reading",
    "electricCurrent": "Current Reading",
    "electricUsage": "Usage (kWh)",
    "room": "Room",
    "save": "Save",
    "cancel": "Cancel",
    "history": "Reading History",
    "noReadings": "No readings recorded yet.",
    "calculatedCost": "Calculated Cost",
    "waterCost": "Water Cost",
    "electricCost": "Electric Cost",
    "rentalCost": "Room Rent",
    "totalCost": "Total Cost",
    "unit": "unit(s)",
    "baht": "Baht"
  },
  "rates": {
    "title": "Utility Rates",
    "addRate": "Add Rate",
    "editRate": "Edit Rate",
    "name": "Rate Name",
    "unit": "Unit",
    "ratePerUnit": "Rate per Unit",
    "isActive": "Active",
    "effectiveFrom": "Effective From",
    "save": "Save",
    "cancel": "Cancel",
    "water": "Water",
    "electric": "Electricity",
    "service": "Service Charge",
    "perCubicMeter": "per m³",
    "perKwh": "per kWh",
    "perMonth": "per month"
  }
};

const metersSectionTh = {
  "meters": {
    "title": "บันทึกมิเตอร์",
    "recordMeter": "บันทึกมิเตอร์",
    "editMeter": "แก้ไขบันทึกมิเตอร์",
    "selectRoom": "เลือกห้อง",
    "month": "เดือน",
    "year": "ปี",
    "water": "น้ำ",
    "electric": "ไฟฟ้า",
    "waterPrevious": "เลขเก่า",
    "waterCurrent": "เลขใหม่",
    "waterUsage": "หน่วยที่ใช้ (ลบ.ม.)",
    "electricPrevious": "เลขเก่า",
    "electricCurrent": "เลขใหม่",
    "electricUsage": "หน่วยที่ใช้ (kWh)",
    "room": "ห้อง",
    "save": "บันทึก",
    "cancel": "ยกเลิก",
    "history": "ประวัติการบันทึก",
    "noReadings": "ยังไม่มีบันทึกมิเตอร์",
    "calculatedCost": "ค่าใช้จ่ายที่คำนวณได้",
    "waterCost": "ค่าน้ำ",
    "electricCost": "ค่าไฟ",
    "rentalCost": "ค่าห้องพัก",
    "totalCost": "รวมทั้งสิ้น",
    "unit": "หน่วย",
    "baht": "บาท"
  },
  "rates": {
    "title": "อัตราค่าใช้จ่าย",
    "addRate": "เพิ่มอัตรา",
    "editRate": "แก้ไขอัตรา",
    "name": "ชื่ออัตรา",
    "unit": "หน่วย",
    "ratePerUnit": "ราคาต่อหน่วย",
    "isActive": "ใช้งาน",
    "effectiveFrom": "มีผลตั้งแต่",
    "save": "บันทึก",
    "cancel": "ยกเลิก",
    "water": "ค่าน้ำ",
    "electric": "ค่าไฟ",
    "service": "ค่าส่วนกลาง",
    "perCubicMeter": "ต่อ ลบ.ม.",
    "perKwh": "ต่อ kWh",
    "perMonth": "ต่อเดือน"
  }
};

function addSection(sourceFile, section, targetFile) {
  let content = fs.readFileSync(sourceFile, "utf8");
  const parsed = JSON.parse(content);
  
  // Add the sections
  Object.assign(parsed, section);
  
  // Write back with pretty formatting
  fs.writeFileSync(targetFile, JSON.stringify(parsed, null, "  ") + "\n");
  console.log("Updated:", targetFile);
}

addSection("messages/en.json", metersSection, "messages/en.json");
addSection("messages/th.json", metersSectionTh, "messages/th.json");
