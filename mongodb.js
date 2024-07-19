const mongoose = require("mongoose");

mongoose.connect('mongodb://localhost:27017/ProcurementForAsl', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error);
  });

const LoginSchema = new mongoose.Schema({
    name: { type: String, required: true },
    password: { type: String, required: true },
    department: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, default: 'None' },
    status: { type: String, default: 'None' }
}, { collection: 'userscollection' });

const GoodRequestSchema = new mongoose.Schema({
  deptName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  officerName: {
    type: String,
    required: true
  },
  itemsToProcure: [{
    item: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    }
  }],
});

const ServiceRequestSchema = new mongoose.Schema({
  deptName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  officerName: {
    type: String,
    required: true
  },
  itemsToProcure: {
    type: String,
    required: true
  }
});

const ApprovalSchema = new mongoose.Schema({
    deptName: {
        type: String,
        required: true
    },
    officerName:{
      type: String,
      required: true
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    requestType: {
        type: String,
        required: true
    },
    itemsToProcure:{
      type: String,
      required: false
    }
}, { collection: 'approvalscollection' });

const UserCollection = mongoose.model("userscollection", LoginSchema);
const GoodsRequestCollection = mongoose.model("goodsrequests", GoodRequestSchema);
const ServiceRequestCollection = mongoose.model("servicerequest", ServiceRequestSchema);
const ApprovalCollection = mongoose.model("ApprovalCollection", ApprovalSchema);

module.exports = { UserCollection, GoodsRequestCollection, ServiceRequestCollection, ApprovalCollection };
