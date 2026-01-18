// Mock Google Apps Script global objects

export class MockSheet {
  private data: any[][];
  private name: string;

  constructor(name: string) {
    this.name = name;
    this.data = [];
  }

  setName(name: string) {
      this.name = name;
      return this;
  }

  getName() { return this.name; }
  
  getDataRange() {
    return {
      getValues: () => this.data,
      getLastRow: () => this.data.length
    };
  }

  getRange(row: number, col: number, numRows?: number, numCols?: number) {
    return {
      getValues: () => {
        // Implement simplified slicing logic for mocks
        const startRow = row - 1;
        const endRow = numRows ? startRow + numRows : startRow + 1;
        const rows = this.data.slice(startRow, endRow);
        
        // Handle column slicing if needed, currently returning full rows or specific implementation
        // For simplicity in basic mocks, we might return the whole row content if columns logic is complex
        // But let's try to be accurate
        return rows.map(r => {
           if (!r) return [];
           const startCol = col - 1;
           const endCol = numCols ? startCol + numCols : startCol + 1;
           return r.slice(startCol, endCol);
        });
      },
      setValue: (val: any) => {
        if (!this.data[row - 1]) this.data[row - 1] = [];
        this.data[row - 1][col - 1] = val;
      },
      setValues: (values: any[][]) => {
        for (let i = 0; i < values.length; i++) {
          if (!this.data[row - 1 + i]) this.data[row - 1 + i] = [];
          for (let j = 0; j < values[i].length; j++) {
            this.data[row - 1 + i][col - 1 + j] = values[i][j];
          }
        }
      },
      setFontWeight: (weight: string) => { /* Mock do nothing */ },
      setBackground: (color: string) => { /* Mock do nothing */ },
      setFontColor: (color: string) => { /* Mock do nothing */ },
    };
  }

  appendRow(rowContents: any[]) {
    this.data.push(rowContents);
    const lastRow = this.data.length;
    return { 
        getRow: () => lastRow,
        setFontWeight: (weight: string) => {}
    }; // Partial Range return
  }

  getLastRow() { return this.data.length; }
  getLastColumn() { return this.data[0]?.length || 0; }
  
  deleteRow(rowPosition: number) {
    this.data.splice(rowPosition - 1, 1);
  }

  // Helper for tests
  clear() {
      this.data = [];
  }
}

export class MockSpreadsheet {
  private sheets: Map<string, MockSheet> = new Map();
  private id: string;

  constructor(id?: string) {
      this.id = id || 'mock-spreadsheet-id';
  }

  getActiveSheet() {
      // Return first sheet or create 'Sheet1'
      const names = Array.from(this.sheets.keys());
      if (names.length === 0) return this.insertSheet('Sheet1');
      return this.sheets.get(names[0])!;
  }

  getSheetByName(name: string) {
    if (!this.sheets.has(name)) {
      this.sheets.set(name, new MockSheet(name));
    }
    return this.sheets.get(name);
  }

  insertSheet(name: string) {
    const sheet = new MockSheet(name);
    this.sheets.set(name, sheet);
    return sheet;
  }
  
  getId() { return this.id; }
}

export class MockLock {
  tryLock() { return true; }
  releaseLock() {}
}

export class MockPropertiesService {
  private props: Map<string, string> = new Map();
  getProperty(key: string) { return this.props.get(key) || null; }
  setProperty(key: string, value: string) { this.props.set(key, value); return this; }
}

export const setupGasMocks = () => {
  const mockSpreadsheet = new MockSpreadsheet();
  const mockProperties = new MockPropertiesService();

  // @ts-ignore
  global.SpreadsheetApp = {
    getActiveSpreadsheet: () => mockSpreadsheet,
    openById: (id: string) => mockSpreadsheet, // Return same mock for simplicity
    openByUrl: (url: string) => mockSpreadsheet,
    create: (name: string) => mockSpreadsheet,
  };

  // @ts-ignore
  global.PropertiesService = {
    getScriptProperties: () => mockProperties,
  };

  // @ts-ignore
  global.LockService = {
    getScriptLock: () => new MockLock(),
  };

  // @ts-ignore
  global.Utilities = {
    getUuid: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9),
    formatDate: (date: Date) => date.toISOString(),
  };

  // @ts-ignore
  global.Session = {
    getActiveUser: () => ({ getEmail: () => 'test@example.com' }),
    getEffectiveUser: () => ({ getEmail: () => 'system@example.com' })
  };
  
  // @ts-ignore
  global.ContentService = {
    createTextOutput: (content: string) => ({
      setMimeType: () => {},
      getContent: () => content
    }),
    MimeType: { JSON: 'application/json' }
  };

  // @ts-ignore
  global.Logger = {
      log: (msg: any) => console.log('[GAS Logger]', msg)
  };

  return mockSpreadsheet;
};
