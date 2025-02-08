const mongoose = require('mongoose');
const mqtt = require('mqtt');
const env = require('dotenv/config')

// ตั้งค่า MongoDB URL
const MONGO_URI = process.env.MongoDB;

// ตั้งค่า MQTT Broker (เปลี่ยนตามที่ใช้)
const MQTT_BROKER = process.env.Mo; // หรือใช้ของตัวเอง  172.20.10.3    192.168.1.38
const MQTT_TOPIC = '/pap/control'; // เปลี่ยนเป็นหัวข้อที่ใช้งานจริง   control

// เชื่อมต่อ MongoDB
async function connectDB() {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
}

//1. สร้าง Schema และ Model


const MessageSchema = new mongoose.Schema({
    name: { type: String, default: "ครีบ" }, // กำหนดค่าเริ่มต้น
    message: { type: [String], default: [] }, // อาร์เรย์ของข้อความ
    timestamp: { type: Date, default: Date.now }
}, { versionKey: false });

const DataSchema = new mongoose.Schema({

    name: String,
    menu:String,
    page: String,
    table: Number,
    row : Number,
    colum : Number,
    statuspage1 : String,
    statuspage2 : String,
    use : String,
    Tapstatus:String,
    Machine:String,

},{versionKey:false});  
// 2. สร้างตัวแปลมาเรียกใช้งาน  colection
const DataModel = mongoose.model('Data', DataSchema);
const StatusModel = mongoose.model('StatusData', DataSchema);
const standardKerserModel = mongoose.model('standardKerser',DataSchema);
const MessageModel = mongoose.model('Message', MessageSchema);

// ฟังก์ชันเพิ่มข้อมูล
// async function insertData(name ,page,table,row,colum) {
//     try {
//         const newData = new DataModel({ name,page,table,row,colum,});
//         await newData.save();
//         console.log('✅ Data Inserted:', JSON.stringify(newData, null, 2));
//     } catch (error) {
//         console.error('❌ Error Inserting Data:', error);
//     }
// }
async function sendMessagesFromMongoDB(name) {
    
    try { 
        // if(name==='TEST'){
        //     const messages = await MessageModel.findOne().sort({ timestamp: -1 }); // หาข้อมูลล่าสุด    edit
        //     console.log("ok");
        // };
        const messages = await MessageModel.findOne({ name: name });
        if (!messages || messages.message.length === 0) {
            console.log("⚠️ No messages found in MongoDB.");
            return;
        };

        let index = 0;
        const interval = setInterval(() => {
            if (index < messages.message.length) {
                const msg = messages.message[index];
                client.publish(MQTT_TOPIC, msg, { qos: 1 }, (err) => {
                    if (err) console.error(`❌ Error sending message: ${err}`);
                    else console.log(`📤 Sent: ${msg}`);
                });
                index++;
            } else {
                clearInterval(interval);
                console.log("✅ All messages sent.");
            }
        }, 1000); // ส่งข้อความทุก 500 มิลลิวินาที
    } catch (error) {
        console.error(`❌ Error fetching messages from MongoDB: ${error}`);
    }
}

async function sendMessagesFromMongoDB1(name) {
    
    try { 
        
        const messages = await MessageModel.findOne({ name: -1 , name :'TEST'}); // หาข้อมูลล่าสุด    edit
        if (!messages || messages.message.length === 0) {
            console.log("⚠️ No messages found in MongoDB.");
            return;
        };

        let index = 0;
        const interval = setInterval(() => {
            if (index < messages.message.length) {
                const msg = messages.message[index];
                client.publish(MQTT_TOPIC, msg, { qos: 1 }, (err) => {
                    if (err) console.error(`❌ Error sending message: ${err}`);
                    else console.log(`📤 Sent: ${msg}`);
                });
                index++;
            } else {
                clearInterval(interval);
                console.log("✅ All messages sent.");
            }
        }, 750); // ส่งข้อความทุก 500 มิลลิวินาที
    } catch (error) {
        console.error(`❌ Error fetching messages from MongoDB: ${error}`);
    }
}



async function insertData( menu ,page,table,row,colum) {
    try {
        const newData = new standardKerserModel({ menu,page,table,row,colum,});
        await newData.save();
        console.log('✅ Data Inserted:', JSON.stringify(newData, null, 2));
    } catch (error) {
        console.error('❌ Error Inserting Data:', error);
    }
}

async function insertStatus(statuspage1,statuspage2) {
    try {
        const newData = new DataModel({ statuspage1,statuspage2});
        await newData.save();
        console.log('✅ Data Inserted:', JSON.stringify(newData, null, 2));
    } catch (error) {
        console.error('❌ Error Inserting Data:', error);
    }
}


// ฟังก์ชันอ่านข้อมูลทั้งหมด
async function fetchAllData() {
    try {
        const data = await DataModel.find();
        console.log('📊 All Data:', data);
    } catch (error) {
        console.error('❌ Error Fetching Data:', error);
    }
}

// ฟังก์ชันลบข้อมูลล่าสุด
async function deleteLatestData() {
    try {
        const latestData = await DataModel.findOne().sort({ timestamp: -1 });
        if (latestData) {
            await DataModel.deleteOne({ _id: latestData._id });
            console.log('🗑️ Deleted Latest Data:', latestData);
        } else {
            console.log('⚠️ No Data to Delete');
        }
    } catch (error) {
        console.error('❌ Error Deleting Data:', error);
    }
}

// ฟังก์ชันอัปเดตข้อมูลล่าสุด
async function updateLatestData(name, value) {
    try {
        const latestData = await DataModel.findOne().sort({ _id: -1 }); // ไม่ใช้ timestamp
        if (latestData) {
            latestData.name = name;
            latestData.value = value;
            await latestData.save();
            console.log('🔄 Updated Latest Data:', JSON.stringify(latestData, null, 2));
        } else {
            console.log('⚠️ No Data to Update');
        }
    } catch (error) {
        console.error('❌ Error Updating Data:', error);
    }
}  




// ฟังก์ชันอัปเดตข้อมูลล่าสุด
async function updatepage(statuspage1, statuspage2) {
    try {
        // const Data = await DataModel.findOne({ statuspage1});
        if(statuspage1=="menu"){
            const latestData = await DataModel.findOne().findOne({ pagedata: "use" }); //  ค้นหาก่อนอัปเดต
            
            if (latestData.statuspage2!==null) {
                // console.log(latestData);
                latestData.menu = await  latestData.statuspage1;
                latestData.Tapstatus = await latestData.statuspage2;
                latestData.statuspage1 = statuspage1;
                latestData.statuspage2 = statuspage2;
                await latestData.save();
                console.log('🔄 Updated Latest Data:', JSON.stringify(latestData, null, 2));
            } else {
                console.log('⚠️ No Data to Update');
            }
        }
        if(statuspage1=="F1" || statuspage1=="F2"|| statuspage1=="F3"){
            const latestData = await DataModel.findOne().findOne({ pagedata: "use" }); //  ค้นหาก่อนอัปเดต
            if (latestData) {

                latestData.statuspage1 =  statuspage1;
                latestData.statuspage2 = statuspage2;
                if(latestData.statuspage2!==null&&latestData.statuspage1=="menu"){
                    console.log("ok");  
                }
                latestData.menu = await  latestData.statuspage1;
                latestData.Tapstatus = await latestData.statuspage2;
                await latestData.save();
                console.log('🔄 Updated Latest Data:', JSON.stringify(latestData, null, 2));
            } else {
                console.log('⚠️ No Data to Update');
            }
        }
        if(statuspage1=="F4"||statuspage1=="F5"||statuspage1=="F6"||statuspage1=="F7"){
            const latestData = await DataModel.findOne().findOne({ pagedata: "use" }); //  ค้นหาก่อนอัปเดต
            if (latestData) {
                latestData.statuspage1 = statuspage1;
                latestData.statuspage2 = statuspage2;
                await latestData.save();
                console.log('🔄 Updated Latest Data:', JSON.stringify(latestData, null, 2));
            } else {
                console.log('⚠️ No Data to Update');
            }
        }
        // if(statuspage1=="F3"){
        //     const latestData = await DataModel.findOne().findOne({ pagedata: "use" }); //  ค้นหาก่อนอัปเดต
        //     if (latestData) {
        //         latestData.statuspage1 = statuspage1;
        //         latestData.statuspage2 = statuspage2;
        //         await latestData.save();
        //         console.log('🔄 Updated Latest Data:', JSON.stringify(latestData, null, 2));
        //     } else {
        //         console.log('⚠️ No Data to Update');
        //     }
        // }

        // if(statuspage1=="F4"){
        //     const latestData = await DataModel.findOne().findOne({ pagedata: "use" }); //  ค้นหาก่อนอัปเดต
        //     if (latestData) {
        //         latestData.statuspage1 = statuspage1;
        //         latestData.statuspage2 = statuspage2;
        //         await latestData.save();
        //         console.log('🔄 Updated Latest Data:', JSON.stringify(latestData, null, 2));
        //     } else {
        //         console.log('⚠️ No Data to Update');
        //     }
        // }

        // const latestData = await DataModel.findOne().findOne({ pagedata: "use" });
        // latestData.Tapstatus = statuspage2;
        // await latestData.save();

    } catch (error) {
        console.error('❌ Error Updating Data:', error);
    }
}  

async function incrementRowWithReset(name) {
    //เพิ่ม Row        menu->F3->F1 หน้า Injec   เช็คว่าอยู่หน้าไหน
    try {
        // ค้นหาข้อมูลล่าสุดจาก MongoDB
        const latestData = await DataModel.findOne({ name: name });
        // F3 -> หาตำแหน่ง 
        if (!latestData) {
            console.log('⚠️ No Data Found for Update');
            return;
        }
        let newRowValue = latestData.row + 1; // บวกค่า row ทีละ 1
        // ถ้า row เกิน 6 ให้กลับเป็น 0
        if (newRowValue > 6) {
            newRowValue = 0;
        }
        // อัปเดตค่า row กลับเข้า MongoDB
        latestData.row = newRowValue;
        await latestData.save();

        console.log('🔄 Row Incremented with Reset:', JSON.stringify(latestData, null, 2));
    } catch (error) {
        console.error('❌ Error Incrementing Row with Reset:', error);
    }
}

async function incrementRowWithReset1(name) {
    //เพิ่ม Row +       menu->F3->F1 หน้า Injec
    try {
        // ค้นหาข้อมูลล่าสุดจาก MongoDB
        const latestData = await DataModel.findOne({ name: name });

        if (!latestData) {
            console.log('⚠️ No Data Found for Update');
            return;
        }

        let newRowValue = latestData.row - 1; // ลบค่า row ทีละ 1

        // ถ้า row เกิน 6 ให้กลับเป็น 0
        if (newRowValue < 0) {
            newRowValue = 6;
        }

        // อัปเดตค่า row กลับเข้า MongoDB
        latestData.row = newRowValue;
        await latestData.save();

        console.log('🔄 Row Incremented with Reset:', JSON.stringify(latestData, null, 2));
    } catch (error) {
        console.error('❌ Error Incrementing Row with Reset:', error);
    }
}

async function incrementRowWithReset3(name) {
    //เพิ่ม Colum --       menu->F3->F1 หน้า Injec
    try {
        // ค้นหาข้อมูลล่าสุดจาก MongoDB
        const latestData = await DataModel.findOne({ name: name });

        if (!latestData) {
            console.log('⚠️ No Data Found for Update');
            return;
        }

        let newRowValue = latestData.colum - 1; // ลบค่า row ทีละ 1

        // ถ้า row เกิน 6 ให้กลับเป็น 0
        if (newRowValue < 0) {
            newRowValue = 6;
        }

        // อัปเดตค่า row กลับเข้า MongoDB
        latestData.colum = newRowValue;
        await latestData.save();

        console.log('🔄 Row Incremented with Reset:', JSON.stringify(latestData, null, 2));
    } catch (error) {
        console.error('❌ Error Incrementing Row with Reset:', error);
    }
}

async function incrementRowWithReset4(name) {
    //เพิ่ม colum ++        menu->F3->F1 หน้า Injec
    try {
        // ค้นหาข้อมูลล่าสุดจาก MongoDB
        const latestData = await DataModel.findOne({ name: name });

        if (!latestData) {
            console.log('⚠️ No Data Found for Update');
            return;
        }

        let newRowValue = latestData.colum + 1; // บวกค่า row ทีละ 1

        // ถ้า row เกิน 6 ให้กลับเป็น 0
        if (newRowValue > 6) {
            newRowValue = 0;
        }

        // อัปเดตค่า row กลับเข้า MongoDB
        latestData.colum = newRowValue;
        await latestData.save();

        console.log('🔄 Row Incremented with Reset:', JSON.stringify(latestData, null, 2));
    } catch (error) {
        console.error('❌ Error Incrementing Row with Reset:', error);
    }
}




// เชื่อมต่อ MQTT
const client = mqtt.connect(MQTT_BROKER);

client.on('connect', () => {
    console.log('✅ Connected to MQTT Broker');
    client.subscribe(MQTT_TOPIC, (err) => {
        if (err) {
            console.error('❌ MQTT Subscribe Error:', err);
        } else {
            console.log(`📡 Subscribed to MQTT Topic: ${MQTT_TOPIC}`);
        }
    });
});

// รับ MQTT มาเข้าใช้งาน
client.on('message', async (topic, message) => {
    const command = message.toString();
    console.log(`📩 Received MQTT Message: ${command}`);  
    
    switch (command) {
        case 'enter':
                await fetchAllData();
            break;
        case '28':  //F1
            const F1 = await DataModel.findOne({ pagedata: "use" }); //  อัปเดตเอฟ1
            console.log(F1.statuspage2);
            // if (F1.statuspage1 !== "menu") {
            // }
            // if (F1.statuspage1 !== "menu" ||F1.statuspage2 == "wait") {
            //     updatepage(F1.statuspage1,"F1");
            // }
           
           if (F1.statuspage1 == "menu" && F1.statuspage2 !== "F1") {
                    updatepage("F1","F1");
            }
             if (F1.statuspage2 !== "F1") {
                break;
            }
            break;
        case '26':  //F2
            const F2 = await DataModel.findOne({ pagedata: "use" }); //  
            console.log(F2.statuspage2);
            if (F2.statuspage1 == "F1" ) {
                break
            }
            if (F2.statuspage2 !== "F2") {
                updatepage(F2.statuspage1,"F2");
            }

            if (F2.statuspage2 == "F1") {
                updatepage(F2.statuspage1,"F2");
            }
            if (F2.statuspage1 == "menu" ) {
                    updatepage("F2","F1");
            }
            break;
        case '25':  //F3
            const F3 = await DataModel.findOne({ pagedata: "use" }); //  
            console.log(F3.statuspage2);
            if (F3.statuspage1 == "F1" ) {
                break
            }
            if (F3.statuspage2 !== "F3") {
                updatepage(F3.statuspage1,"F3");
            }

            if (F3.statuspage2 == "F1") {
                updatepage(F2.statuspage1,"F3");
            }
            if (F3.statuspage1 == "menu" ) {
                    updatepage("F3","F1");
            }
            break;
            
        // case '4':  //F4
        //     const F4 = await DataModel.findOne({ pagedata: "use" }); //  ค้นหาก่อนอัปเดต
            
        //     if (F4.statuspage2 !== "F4"&&F4.statuspage2 !== "F1") {
        //         updatepage(F2.statuspage1,"F4");
        //     }

        //     if (F4.statuspage2 === "F1") {
        //         await updatepage(F4.statuspage1,"F4");
        //     }
        //     if (F4.statuspage1 === "menu" || F4.statuspage2 === null) {
        //         console.log(F4.statuspage2 +":"+F4.statuspage1);
        //         await updatepage("F4","wait");
        //     }
        //     if (!F4) {
        //         console.log("⚠️ ไม่พบข้อมูลที่ตรงกัน (F4 เป็น null หรือ undefined)");
        //         break;
        //     }
           
        //     break;
        // case '5':  //F5
        //     const F5 = await DataModel.findOne({ pagedata: "use" }); //  ค้นหาก่อนอัปเดต
        //     console.log(F5.statuspage2 + " : ข้อมูล");
        //     if (F5.statuspage2 == "wait") {
        //         await updatepage(F5.statuspage1,"F5");
        //     }
        //     if (F5.statuspage1 == "menu" || F5.statuspage2 == null) {
        //         await updatepage("F5","wait");
        //     }

        //     console.log(111);
        //     break;
        // case '6':  //F6
        //     const F6 = await DataModel.findOne({ pagedata: "use" }); //  ค้นหาก่อนอัปเดต
        //     if (F6.statuspage2 == "wait") {
        //         await updatepage(F6.statuspage1,"F6");
        //     }
        //     if (F6.statuspage1 == "menu" || F6.statuspage2 == null) {
        //         await updatepage("F6","wait");
        //     }
        //     break;
        // case '7':  //F7
        //     const F7 = await DataModel.findOne({ pagedata: "use" }); //  ค้นหาก่อนอัปเดต
        //     if (F7.statuspage2 == "wait") {
        //         await updatepage(F7.statuspage1,"F7");
        //     }
        //     if (F7.statuspage1 == "menu" || F7.statuspage2 == null) {
        //         await updatepage("F7","wait");
        //     }
        //     break;
       
        case '1':
            updatepage("menu",null);
            //await  insertStatus('menu',null); // สร้างค่าแบบสุ่มz
            break;
        case '32':// กดลง
            await incrementRowWithReset('F3');
            break;
        case '31'://ขวา
            await incrementRowWithReset4('F3');   
            break;
        case '30'://ซ้าย
            await incrementRowWithReset3('F3');  
            break;
        case '29'://ขึ้น
            await incrementRowWithReset1('F3');  
            break;
        // case 'ลดครีบ':
        //     await  sendMessagesFromMongoDB(command);
        //     break;
        case 'เพิ่มเนื้อ1':
            await  sendMessagesFromMongoDB(command);
            break;
        case 'เพิ่มเนื้อ2':
            await  sendMessagesFromMongoDB(command);
            break;
        // case 'reset':
        //     await  sendMessagesFromMongoDB(command);
        //     break;
        // case 'test':
        //     await  sendMessagesFromMongoDB(command);
        //     break;
        // case 'TEST':
        //     await  sendMessagesFromMongoDB1(command);
        //     break;
        default:
            console.log('⚠️ Unknown Command');
    }
});

// เชื่อมต่อ MongoDB เมื่อเริ่มต้นโปรแกรม
connectDB();

// ให้โค้ดรันตลอดเวลาโดยไม่จบการทำงาน
// setInterval(() => {
//     console.log('🔄 Waiting for MQTT messages...');
// }, 10000); // ทุก 10 วินาที แสดงข้อความว่ายังทำงานอยู่
