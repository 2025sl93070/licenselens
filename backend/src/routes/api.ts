import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { parseFile } from '../parsers';
import { analyzeProject, saveAnalysis, getHistory, getAnalysisById } from '../services/analyzer';
import { getSampleDependencies } from '../data/sampleData';
import { DEFAULT_POLICIES } from '../data/policies';
import { LICENSE_DATABASE } from '../data/licenses';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'package.json',
      'package-lock.json',
      'requirements.txt',
      'pipfile.lock',
      'pom.xml',
      'build.gradle',
    ];
    if (allowed.includes(file.originalname.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file: ${file.originalname}. Supported: ${allowed.join(', ')}`));
    }
  },
});

// POST /api/analyze — file upload
router.post('/analyze', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Send a dependency file as "file" field.' });
    }

    const content = req.file.buffer.toString('utf-8');
    const filename = req.file.originalname;
    const projectName = (req.body.projectName as string) || filename;
    const policyId = (req.body.policyId as string) || 'enterprise-safe';

    const { deps, ecosystem } = parseFile(filename, content);

    const result = analyzeProject(projectName, ecosystem, deps, policyId);
    saveAnalysis(result);

    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/analyze/demo — analyze with sample data (no file needed)
router.post('/analyze/demo', (req: Request, res: Response, next: NextFunction) => {
  try {
    const policyId = (req.body?.policyId as string) || 'enterprise-safe';
    const deps = getSampleDependencies();
    const result = analyzeProject('demo-project', 'npm', deps, policyId);
    saveAnalysis(result);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/analyze/:id
router.get('/analyze/:id', (req: Request, res: Response) => {
  const result = getAnalysisById(req.params.id);
  if (!result) {
    return res.status(404).json({ error: 'Analysis not found' });
  }
  return res.json(result);
});

// GET /api/history
router.get('/history', (_req: Request, res: Response) => {
  return res.json(getHistory());
});

// GET /api/licenses
router.get('/licenses', (_req: Request, res: Response) => {
  return res.json(Object.values(LICENSE_DATABASE));
});

// GET /api/policies
router.get('/policies', (_req: Request, res: Response) => {
  return res.json(DEFAULT_POLICIES);
});

// GET /api/health
router.get('/health', (_req: Request, res: Response) => {
  return res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
