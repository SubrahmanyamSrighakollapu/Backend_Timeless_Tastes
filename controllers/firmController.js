const Firm = require("../models/Firm");

const Vendor = require("../models/Vendor");

const { analyzeRestaurantSentiment } = require("../utils/googleReviews");

const multer = require("multer");

const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// const addFirm = async (req, res) => {
//   try {
//     const { firmName, area, category, region, offer } = req.body;

//     const image = req.file ? req.file.filename : undefined;

//     const vendor = await Vendor.findById(req.vendorId);
//     if (!vendor) {
//       res.status(404).json({ message: "Vendor not found" });
//     }

//     if (vendor.firm.length > 0) {
//       return res.status(400).json({ message: "vendor can have only one firm" });
//     }

//     const firm = new Firm({
//       firmName,
//       area,
//       category,
//       region,
//       offer,
//       image,
//       vendor: vendor._id,
//     });

//     const savedFirm = await firm.save();

//     const firmId = savedFirm._id;
//     const vendorFirmName = savedFirm.firmName;

//     vendor.firm.push(savedFirm);

//     await vendor.save();

//     return res
//       .status(200)
//       .json({ message: "Firm Added successfully ", firmId, vendorFirmName });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "internal server error", error: error });
//   }
// };

const addFirm = async (req, res) => {
  try {
    const { firmName, area, category, region, offer } = req.body;
    const image = req.file ? req.file.filename : undefined;

    const vendor = await Vendor.findById(req.vendorId);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    if (vendor.firm.length > 0) {
      return res.status(400).json({ message: "Vendor can have only one firm" });
    }

    // 🔍 Sentiment Analysis
    const sentimentScore = await analyzeRestaurantSentiment(firmName, area);

    if (sentimentScore === null) {
      return res.status(400).json({
        message: "Could not fetch or analyze reviews for the firm.",
      });
    }

    if (sentimentScore < 50) {
      return res.status(403).json({
        message: `Firm rejected. Sentiment score (${sentimentScore.toFixed(
          2
        )}%) is below threshold.`,
        sentimentScore: sentimentScore.toFixed(2),
      });
    }

    const firm = new Firm({
      firmName,
      area,
      category,
      region,
      offer,
      image,
      vendor: vendor._id,
    });

    const savedFirm = await firm.save();
    vendor.firm.push(savedFirm._id);
    await vendor.save();

    return res.status(200).json({
      message: "Firm added successfully",
      sentimentScore: sentimentScore.toFixed(2),
      firmId: savedFirm._id,
      vendorFirmName: savedFirm.firmName,
    });
  } catch (error) {
    console.error("Error adding firm:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteFirmById = async (req, res) => {
  try {
    const productId = req.params.firmId;
    const deleteProduct = await Firm.findByIdAndDelete(firmId);

    if (!deleteProduct) {
      return res.status(404).json({ error: "No Firm Found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// module.exports = { addFirm: [upload.single("image"), addFirm], deleteFirmById };

module.exports = { addFirm, deleteFirmById };
