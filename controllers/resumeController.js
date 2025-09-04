import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import Resume from '../models/Resume.js';
import cloudinary from '../config/cloudinary.js'; // for delete uploaded resume file from cloudinary

const extractTextFromFile = async (file) => {
  try {
    const buffer = fs.readFileSync(file.path);

    if (file.mimetype === 'application/pdf') {
      const data = await pdfParse(buffer);
      return data.text;
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
  } catch (err) {
    console.error('Text extraction failed:', err);
  }

  return '';
};

const extractSections = (text) => {
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  let email = '';
  const profileSummaryLines = [];
  const skills = [];
  const education = [];
  const experience = [];

  // Extract email early
  lines.forEach(line => {
    const emailMatch = line.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    if (emailMatch && !email) {
      email = emailMatch[0];
    }
  });

  // Keyword maps
  const skillKeywords = /react|node|express|mongodb|html|css|javascript|firebase|bootstrap|git|api|frontend|backend|fullstack/i;
  const eduKeywords = /bachelor|intermediate|matric|school|university|quest|grade|education|degree/i;
  const expKeywords = /developer|engineer|intern|technologies|solutions|company|office|maintained|built|collaborated|debugged|deployed|experience|worked/i;
  const profileKeywords = /passionate|collaborative|problem|user experience|learning|innovation|creative|summary|objective/i;

  // Classify lines
  lines.forEach(line => {
    if (line.length < 5) return;

    const lower = line.toLowerCase();

    if (profileKeywords.test(lower)) {
      profileSummaryLines.push(line);
    } else if (skillKeywords.test(lower)) {
      skills.push(...line.split(/[,•\-:]/).map(s => s.trim()).filter(s => s.length > 2));
    } else if (eduKeywords.test(lower)) {
      education.push(line);
    } else if (expKeywords.test(lower)) {
      experience.push(line);
    } else if (line.length > 50 && !skillKeywords.test(lower) && !eduKeywords.test(lower) && !expKeywords.test(lower)) {
      profileSummaryLines.push(line); // fallback for long descriptive lines
    }
  });

  // Clean up arrays
  const cleanArray = (arr) =>
    [...new Set(arr.map(e => e.trim()).filter(e => e.length > 3))];

  return {
    email,
    profileSummary: profileSummaryLines.join(' ').trim(),
    skills: cleanArray(skills),
    education: cleanArray(education),
    experience: cleanArray(experience).join(' ')
  };
};


// export const createResume = async (req, res) => {
//   try {
//     // 1. Destructure NEW fields from req.body
//     const { email, profileSummary, skills, education, experience } = req.body;
//     const file = req.file;
    

//     // 2. Update validation to include new fields
//     const hasManualData = email || profileSummary || skills || education || experience;
//     const allowedTypes = [
//       'application/pdf',
//       'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
//     ];

//     let resumeFile = null;
//     // 3. Initialize extracted data with new fields
//     let extracted = { 
//       email: '', 
//       profileSummary: '', 
//       skills: [], 
//       education: [], 
//       experience: '' 
//     };

//     if (file) {
//       if (!allowedTypes.includes(file.mimetype)) {
//         return res.status(400).json({ error: 'Unsupported file type' });
//       }

//       resumeFile = {
//         filename: file.filename,
//         mimetype: file.mimetype,
//         path: file.path
//       };

//       const rawText = await extractTextFromFile(file);
//       extracted = extractSections(rawText);
//     }

//     // 4. Validate that we have at least an email (if required by your schema)
//     const finalEmail = email || extracted.email;
//     if (!finalEmail) {
//       return res.status(400).json({ error: 'Email is required.' });
//     }

//     if (!hasManualData && !file) {
//       return res.status(400).json({ error: 'Please provide resume details or upload a file.' });
//     }

//     // 5. Create the resume with ALL fields, choosing between manual input and extracted data
//     const resume = await Resume.create({
//       userId: req.user.userId,
//       email: finalEmail,
//       profileSummary: profileSummary || extracted.profileSummary,
//       skills: skills ? skills.split(',').map(s => s.trim()) : extracted.skills,
//       education: education ? education.split(',').map(e => e.trim()) : extracted.education,
//       experience: experience || extracted.experience,
//       resumeFile
//     });

//     // 6. Clean up the uploaded file after processing (optional but good practice)
//     if (file) {
//       fs.unlink(file.path, (err) => {
//         if (err) console.error('Error deleting file:', err);
//       });
//     }

//     res.status(201).json(resume);
//   } catch (err) {
//     console.error('Resume creation failed:', err);
//     res.status(400).json({ error: 'Resume creation failed', details: err.message });//400 for bad request
//   }
// };
export const createResume = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Missing form data.' });
    }

    const {
      email = '',
      profileSummary = '',
      skills = '',
      education = '',
      experience = ''
    } = req.body;

    const file = req.file;
    const hasManualData = email || profileSummary || skills || education || experience;
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    let resumeFile = null;
    let extracted = {
      email: '',
      profileSummary: '',
      skills: [],
      education: [],
      experience: ''
    };

    if (file) {
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ error: 'Unsupported file type' });
      }

      resumeFile = {
        filename: file.filename,
        mimetype: file.mimetype,
        path: file.path
      };

      const rawText = await extractTextFromFile(file);
      extracted = extractSections(rawText);
    }

    const finalEmail = email || extracted.email;
    if (!finalEmail) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    if (!hasManualData && !file) {
      return res.status(400).json({ error: 'Please provide resume details or upload a file.' });
    }

    const resume = await Resume.create({
      userId: req.user.userId,
      email: finalEmail,
      profileSummary: profileSummary || extracted.profileSummary,
      skills: skills ? skills.split(',').map(s => s.trim()) : extracted.skills,
      education: education ? education.split(',').map(e => e.trim()) : extracted.education,
      experience: experience || extracted.experience,
      resumeFile
    });

    if (file) {
      fs.unlink(file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    res.status(201).json(resume);
  } catch (err) {
    console.error('Resume creation failed:', err);
    res.status(400).json({ error: 'Resume creation failed', details: err.message });
  }
};


export const uploadResume = async (req, res) => {
  try {
    const resumeUrl = req.file.path;
    const file = req.file;
    const { userId, email } = req.body;

    if (!userId || !email || !resumeUrl) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const resume = await Resume.create({
      userId,
      email,
      resumeFile: {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        path: file.secure_url, // always publicly accessible
        public_id: file.filename
      }
    });
console.log('Cloudinary file:', req.file);

    res.status(201).json(resume);
  } catch (err) {
    console.error('Resume upload failed:', err);
    res.status(500).json({ error: 'Resume upload failed', details: err.message });
  }
};


export const getResume = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.userId });
    if (!resumes.length) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    res.json(resumes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch resumes' });
  }
};

// Get resume by ID to autofill the fields while updating resume
export const getResumeById = async (req, res) => {
  try {
    const { id } = req.params;

    // Ensure the resume belongs to the logged-in candidate
    const resume = await Resume.findOne({ _id: id, userId: req.user.userId });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found or unauthorized' });
    }

    res.json(resume);
  } catch (err) {
    console.error('Error fetching resume by ID:', err);
    res.status(500).json({ error: 'Failed to fetch resume' });
  }
};

// Update resume by ID
export const updateResume = async (req, res) => {
  try {
    const { id } = req.params;

    // Extract updated fields from request body
    const { email, profileSummary, skills, education, experience } = req.body;

    // Build update object
    const updateData = {
      email,
      profileSummary,
      skills: Array.isArray(skills) ? skills : skills?.split(',').map(s => s.trim()),
      education: Array.isArray(education) ? education : education?.split(',').map(e => e.trim()),
      experience
    };

    const updatedResume = await Resume.findOneAndUpdate(
      { _id: id, userId: req.user.userId },
      updateData,
      { new: true }
    );

    if (!updatedResume) {
      return res.status(404).json({ error: 'Resume not found or unauthorized' });
    }

    res.json(updatedResume);
  } catch (err) {
    console.error('Error updating resume:', err);
    res.status(500).json({ error: 'Failed to update resume' });
  }
};



// Delete a user's resume
export const deleteResume = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find the resume by ID and user
    const resume = await Resume.findOne({ _id: id, userId: req.user.userId });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const publicId = resume.resumeFile?.public_id;

    // 2. Attempt to delete Cloudinary file if it exists
    if (publicId) {
      let deleted = false;

      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
        console.log('Deleted from Cloudinary as image:', publicId);
        deleted = true;
      } catch (err) {
        console.warn('Image deletion failed, trying raw:', err.message);
      }
       if (!deleted) {
        try {
          await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
          console.log('Deleted from Cloudinary as raw:', publicId);
        } catch (err) {
          console.error('Raw deletion failed:', err.message);
        }
      }
    }

    // 3. Delete resume document from MongoDB
    await Resume.findByIdAndDelete(id);

    // 4. Respond with success
    res.status(200).json({ message: 'Resume and file deleted successfully' });

  } catch (err) {
    console.error('Resume deletion failed:', err);

    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid resume ID' });
    }
    res.status(500).json({ error: 'Failed to delete resume', details: err.message });
  }
};


//Preview resume before saving
export const previewResume = async (req, res) => {
  try {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordpressml.document'
    ];

    if (!req.file || !allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    const rawText = await extractTextFromFile(req.file);
    const extracted = extractSections(rawText);

    res.json(extracted);
  } catch (err) {
    console.error('Resume preview failed:', err);
    res.status(500).json({ error: 'Failed to preview resume' });
  }
};

// Add this to your resumeController.js
export const getResumeFile = async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findOne({ _id: id, userId: req.user.userId }); // Auth check

    if (!resume || !resume.resumeFile) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if file exists on disk
    if (!fs.existsSync(resume.resumeFile.path)) {
      return res.status(404).json({ error: 'File has been deleted' });
    }

    // Set headers for download/preview
    res.setHeader('Content-Type', resume.resumeFile.mimetype);
    // For PDFs, allow preview in browser. For DOCX, force download.
    const disposition = resume.resumeFile.mimetype === 'application/pdf' ? 'inline' : 'attachment';
    res.setHeader('Content-Disposition', `${disposition}; filename="${resume.resumeFile.filename}"`);

    // Stream the file to the user
    const fileStream = fs.createReadStream(resume.resumeFile.path);
    fileStream.pipe(res);
  } catch (err) {
    console.error('File download failed:', err);
    res.status(500).json({ error: 'Failed to download file' });
  }
};


