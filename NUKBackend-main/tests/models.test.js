const mongoose = require("mongoose");
const User = require("../src/models/User");
const ServiceListing = require("../src/models/ServiceListing");
const Property = require("../src/models/Property");
const JobApplication = require("../src/models/JobApplication");

describe("Student Connect model validation", () => {
  test("User rejects unsupported roles", async () => {
    const user = new User({ name: "Test User", email: "test@example.com", phone: "9876543210", password: "hashed", location: "Bengaluru", role: "superuser" });
    await expect(user.validate()).rejects.toThrow();
  });

  test("ServiceListing requires a valid price range", async () => {
    const listing = new ServiceListing({
      providerId: new mongoose.Types.ObjectId(), categoryId: new mongoose.Types.ObjectId(),
      listingType: "job", title: "Evening helper", description: "Part-time evening work at a home.",
      location: "Bengaluru", priceRange: { min: 500, max: 200 }
    });
    await expect(listing.validate()).rejects.toThrow();
  });

  test("Property only accepts supported property types", async () => {
    const property = new Property({ ownerId: new mongoose.Types.ObjectId(), type: "office", title: "Nice property", description: "A property description", rent: 5000, address: "Test address", location: "Bengaluru" });
    await expect(property.validate()).rejects.toThrow();
  });

  test("JobApplication starts pending", () => {
    const application = new JobApplication({ jobId: new mongoose.Types.ObjectId(), studentId: new mongoose.Types.ObjectId() });
    expect(application.status).toBe("pending");
  });
});
