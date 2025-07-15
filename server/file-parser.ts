
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import xlsx from 'xlsx';

interface ParsedCourse {
  name: string;
  code: string;
  description?: string;
  department?: string;
  credits?: number;
}

export async function parseCoursesFromFile(file: Express.Multer.File): Promise<ParsedCourse[]> {
  const mimeType = file.mimetype;
  
  try {
    switch (mimeType) {
      case 'application/pdf':
        return await parsePDF(file.buffer);
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        return await parseWord(file.buffer);
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      case 'application/vnd.ms-excel':
        return await parseExcel(file.buffer);
      case 'text/csv':
        return await parseCSV(file.buffer);
      default:
        throw new Error('Unsupported file type');
    }
  } catch (error) {
    console.error('File parsing error:', error);
    throw new Error(`Failed to parse file: ${error.message}`);
  }
}

async function parsePDF(buffer: Buffer): Promise<ParsedCourse[]> {
  const data = await pdfParse(buffer);
  const text = data.text;
  
  return extractCoursesFromText(text);
}

async function parseWord(buffer: Buffer): Promise<ParsedCourse[]> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value;
  
  return extractCoursesFromText(text);
}

async function parseExcel(buffer: Buffer): Promise<ParsedCourse[]> {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  
  return extractCoursesFromSpreadsheet(data as string[][]);
}

async function parseCSV(buffer: Buffer): Promise<ParsedCourse[]> {
  const text = buffer.toString('utf-8');
  const lines = text.split('\n').map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')));
  
  return extractCoursesFromSpreadsheet(lines);
}

function extractCoursesFromText(text: string): ParsedCourse[] {
  const courses: ParsedCourse[] = [];
  const lines = text.split('\n').filter(line => line.trim());
  
  // Common patterns for course codes (e.g., CS101, MATH-201, BIO 301)
  const courseCodePattern = /([A-Z]{2,4}[-\s]?\d{3,4})/g;
  
  for (const line of lines) {
    const matches = line.match(courseCodePattern);
    if (matches) {
      for (const match of matches) {
        const code = match.replace(/[-\s]/g, '');
        const department = code.replace(/\d+/, '');
        
        // Try to extract course name from the same line
        const parts = line.split(/[:\-\|]/);
        let name = '';
        let description = '';
        
        if (parts.length > 1) {
          name = parts[1].trim();
          if (parts.length > 2) {
            description = parts[2].trim();
          }
        } else {
          // Fallback: use the line without the course code
          name = line.replace(match, '').trim();
        }
        
        // Extract credits if mentioned
        const creditsMatch = line.match(/(\d+)\s*(credit|unit|hour)/i);
        const credits = creditsMatch ? parseInt(creditsMatch[1]) : undefined;
        
        if (name && name.length > 5) { // Only add if we have a meaningful course name
          courses.push({
            code,
            name: name.substring(0, 255), // Limit length
            description: description.substring(0, 500) || undefined,
            department: department || undefined,
            credits
          });
        }
      }
    }
  }
  
  return courses;
}

function extractCoursesFromSpreadsheet(data: string[][]): ParsedCourse[] {
  const courses: ParsedCourse[] = [];
  
  if (data.length === 0) return courses;
  
  // Try to identify header row
  const headers = data[0].map(h => h?.toString().toLowerCase() || '');
  const codeIndex = headers.findIndex(h => h.includes('code') || h.includes('course id'));
  const nameIndex = headers.findIndex(h => h.includes('name') || h.includes('title') || h.includes('course'));
  const descIndex = headers.findIndex(h => h.includes('desc') || h.includes('summary'));
  const deptIndex = headers.findIndex(h => h.includes('dept') || h.includes('department'));
  const creditsIndex = headers.findIndex(h => h.includes('credit') || h.includes('unit') || h.includes('hour'));
  
  // If no clear headers found, assume first few columns
  const startRow = (codeIndex >= 0 || nameIndex >= 0) ? 1 : 0;
  const fallbackCodeIndex = codeIndex >= 0 ? codeIndex : 0;
  const fallbackNameIndex = nameIndex >= 0 ? nameIndex : 1;
  
  for (let i = startRow; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    const code = row[fallbackCodeIndex]?.toString().trim();
    const name = row[fallbackNameIndex]?.toString().trim();
    
    if (!code || !name || code.length < 2 || name.length < 3) continue;
    
    const description = descIndex >= 0 ? row[descIndex]?.toString().trim() : undefined;
    const department = deptIndex >= 0 ? row[deptIndex]?.toString().trim() : 
                      code.replace(/\d+/, ''); // Extract dept from code if not provided
    const credits = creditsIndex >= 0 ? parseInt(row[creditsIndex]?.toString() || '0') || undefined : undefined;
    
    courses.push({
      code: code.substring(0, 20),
      name: name.substring(0, 255),
      description: description?.substring(0, 500) || undefined,
      department: department?.substring(0, 100) || undefined,
      credits
    });
  }
  
  return courses;
}
