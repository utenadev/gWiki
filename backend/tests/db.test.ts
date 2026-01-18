import { describe, expect, test, beforeEach, beforeAll } from "bun:test";
import { setupGasMocks, MockSpreadsheet } from "./mocks/gas";
// Import source files directly
// Note: We need to ensure db.ts exports the DB class
import { DB } from "../src/db"; 

// Setup mocks before importing modules that might use them at top-level
let mockSpreadsheet: MockSpreadsheet;

beforeAll(() => {
  mockSpreadsheet = setupGasMocks();
});

describe("DB Operations", () => {
  let db: DB;

  beforeEach(() => {
    // Reset mocks for each test
    mockSpreadsheet = setupGasMocks();
    db = new DB(); 
  });

  test("should create a page", () => {
    const page = db.createPage("Test Title", "Test Content", ["tag1"]);
    expect(page.title).toBe("Test Title");
    expect(page.content).toBe("Test Content");
    expect(page.id).toBeDefined();
    
    // Verify data was written to mock sheet
    const sheet = mockSpreadsheet.getSheetByName('Pages');
    expect(sheet).toBeDefined();
    expect(sheet!.getDataRange().getValues().length).toBeGreaterThan(0);
  });

  test("should get a page by id", () => {
    // Create first
    const created = db.createPage("Read Me", "Content", []);
    
    // Read back
    const read = db.getPageById(created.id);
    expect(read).toBeDefined();
    expect(read!.title).toBe("Read Me");
  });
});
