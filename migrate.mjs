import fs from 'fs';
import path from 'path';

const basePath = process.cwd();
const pagesDir = path.join(basePath, 'src', 'pages');
const appDir = path.join(basePath, 'app');

if (!fs.existsSync(appDir)) {
  fs.mkdirSync(appDir, { recursive: true });
}

// Map Page component names to route paths
const routeMap = {
  'Home.tsx': '',
  'Jobs.tsx': 'jobs',
  'PostJob.tsx': 'post-job',
  'Dashboard.tsx': 'dashboard',
  'Messages.tsx': 'messages',
  'Profile.tsx': 'profile',
  'CVBuilder.tsx': 'cv-builder',
  'SetupSupabase.tsx': 'setup',
  'Pricing.tsx': 'pricing',
  'Contact.tsx': 'contact',
  'Privacy.tsx': 'privacy',
  'Terms.tsx': 'terms',
  'Cookies.tsx': 'cookies',
  'InterviewTips.tsx': 'interview-tips',
  'SearchResumes.tsx': 'search-resumes',
};

// Generic pages map (these were in App.tsx)
const genericRoutes = ['job-alerts', 'about', 'blog', 'help'];

function transformContent(content) {
  let newContent = content;
  
  // Always use client for these migrated pages
  if (!newContent.startsWith('"use client"')) {
    newContent = '"use client";\n' + newContent;
  }

  // Replace react-router-dom imports
  if (newContent.includes('react-router-dom')) {
    newContent = newContent.replace(/import\s+{([^}]+)}\s+from\s+['"]react-router-dom['"];?/g, (match, imports) => {
      let nextImports = [];
      let navImports = [];
      
      const parts = imports.split(',').map(p => p.trim());
      parts.forEach(p => {
        if (p === 'Link') {
          nextImports.push(`import Link from 'next/link';`);
        } else if (p === 'useNavigate') {
          navImports.push('useRouter');
        } else if (p === 'useLocation') {
          navImports.push('usePathname');
        }
      });
      
      let res = nextImports.join('\n');
      if (navImports.length > 0) {
        res += `\nimport { ${navImports.join(', ')} } from 'next/navigation';`;
      }
      return res;
    });
  }

  // Replace useNavigate with useRouter
  newContent = newContent.replace(/useNavigate\(\)/g, 'useRouter()');
  // Replace useLocation with usePathname
  newContent = newContent.replace(/useLocation\(\)/g, 'usePathname()');
  // Replace location.pathname with pathname
  newContent = newContent.replace(/location\.pathname/g, 'pathname');

  // Replace <Link to="..."> with <Link href="...">
  newContent = newContent.replace(/<Link([^>]*?)to=/g, '<Link$1href=');

  return newContent;
}

// 1. Move Pages
if (fs.existsSync(pagesDir)) {
  const files = fs.readdirSync(pagesDir);
  for (const file of files) {
    if (file === 'GenericPage.tsx') continue; // Handle later or ignore
    
    let route = routeMap[file];
    if (route === undefined) {
      route = file.replace('.tsx', '').toLowerCase();
    }
    
    const targetDir = path.join(appDir, route);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    const content = fs.readFileSync(path.join(pagesDir, file), 'utf8');
    const newContent = transformContent(content);
    
    fs.writeFileSync(path.join(targetDir, 'page.tsx'), newContent);
  }
}

// Generate generic pages
genericRoutes.forEach(route => {
  const targetDir = path.join(appDir, route);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  let title = route;
  if (route === 'job-alerts') title = 'تنبيهات الوظائف';
  if (route === 'about') title = 'من نحن';
  if (route === 'blog') title = 'المدونة';
  if (route === 'help') title = 'مركز المساعدة';
  
  const content = `"use client";
import GenericPage from '../../src/pages/GenericPage';
export default function Page() {
  return <GenericPage title="${title}" />;
}
`;
  fs.writeFileSync(path.join(targetDir, 'page.tsx'), content);
});


// 2. Update Components
const componentsToUpdate = [
  path.join(basePath, 'src', 'components', 'layout', 'Navbar.tsx'),
  path.join(basePath, 'src', 'components', 'layout', 'Footer.tsx'),
  path.join(basePath, 'src', 'hooks', 'useNotifications.tsx')
];

for (const compPath of componentsToUpdate) {
  if (fs.existsSync(compPath)) {
    const content = fs.readFileSync(compPath, 'utf8');
    const newContent = transformContent(content);
    fs.writeFileSync(compPath, newContent);
  }
}

// 3. Delete old app files
const filesToDelete = [
  path.join(basePath, 'src', 'App.tsx'),
  path.join(basePath, 'src', 'main.tsx')
];
for (const file of filesToDelete) {
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

// Update package.json scripts
const pkgPath = path.join(basePath, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.scripts = {
    ...pkg.scripts,
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  };
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}

console.log('Migration script completed.');
