// utils/googleReviews.js
const axios = require("axios");
const Sentiment = require("sentiment");
require("dotenv").config();

const sentiment = new Sentiment();
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

async function getPlaceId(firmName, area) {
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json`,
    {
      params: {
        input: `${firmName}, ${area}`,
        inputtype: "textquery",
        fields: "place_id",
        key: GOOGLE_API_KEY,
      },
    }
  );
  console.log("🎯 Google Find Place response:", response.data);

  const candidates = response.data.candidates;
  return candidates.length > 0 ? candidates[0].place_id : null;
}

async function getReviewsByPlaceId(placeId) {
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/place/details/json`,
    {
      params: {
        place_id: placeId,
        fields: "reviews",
        key: GOOGLE_API_KEY,
      },
    }
  );

  const reviews = response.data.result.reviews || [];

  console.log("📝 Full place details response:");
  reviews.forEach((review, index) => {
    console.log(`\n📌 Review ${index + 1}:`);
    console.log(`Author: ${review.author_name}`);
    console.log(`Rating: ${review.rating}`);
    console.log(`Text: ${review.text}`);
    console.log(`Time: ${new Date(review.time * 1000).toLocaleString()}`);
  });

  return reviews;
}

function calculateSentimentScore(reviews) {
  const scores = reviews.map((review) => {
    const result = sentiment.analyze(review.text);
    return result.comparative; // normalized score
  });

  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  const normalized = ((average + 1) / 2) * 100;

  const finalScore = Math.max(0, Math.min(100, normalized));

  return finalScore;
}

async function analyzeRestaurantSentiment(firmName, area) {
  console.log("🛠️ Using Google API Key:", GOOGLE_API_KEY);
  console.log(`🔍 Searching for: ${firmName}, ${area}`);

  try {
    const placeId = await getPlaceId(firmName, area);
    console.log("📍 Found placeId:", placeId);
    if (!placeId) return null;

    const reviews = await getReviewsByPlaceId(placeId);
    console.log(`💬 Found ${reviews.length} reviews`);

    if (!reviews.length) return null;

    const score = calculateSentimentScore(reviews);
    console.log("📊 Sentiment Score:", score);
    return score;
  } catch (error) {
    console.error("Error analyzing sentiment:", error.message);
    console.error("❌ Error analyzing sentiment:", error.message);
    return null;
  }
}

module.exports = {
  analyzeRestaurantSentiment,
};
