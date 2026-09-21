/* Sample data for the demo build. Nothing here is real. */
window.RC = window.RC || {};
(function () {
  const D = RC.DATA = {};

  /* ---------- people (avatars) ---------- */
  D.people = {
    aarav: { skin: '#E0AC82', skinShade: '#c78d63', hair: '#1b1b22', style: 'short', shirt: '#0B7E62', bg: '#DDEFE8' },
    sneha: { skin: '#D89B75', skinShade: '#bd7d58', hair: '#22181a', style: 'bun', shirt: '#B3282D', bg: '#F6DCDD', bindi: true, smile: 'wide' },
    riya: { skin: '#E7B48F', skinShade: '#cc9670', hair: '#2a1b1b', style: 'long', shirt: '#3F5A86', bg: '#DFE8F6' },
    kabir: { skin: '#C98E66', skinShade: '#ae7247', hair: '#15151a', style: 'side', shirt: '#26262e', bg: '#E7E5E0', glasses: true, beard: true },
    meera: { skin: '#DDA47D', skinShade: '#c2895f', hair: '#241716', style: 'curly', shirt: '#D68A0A', bg: '#FBEBCB', smile: 'wide' },
    moderator: { skin: '#D19A74', skinShade: '#b67e58', hair: '#8b8b95', style: 'short', shirt: '#6B4FBB', bg: '#EAE4F7', glasses: true, tie: '#B3282D', collar: '#fff' },
    priya: { skin: '#E2AD86', skinShade: '#c68f68', hair: '#1e1416', style: 'long', shirt: '#B3282D', bg: '#F6DCDD', bindi: true, smile: 'wide' },
    vikram: { skin: '#C48962', skinShade: '#a86d46', hair: '#111', style: 'short', shirt: '#0B0B0F', bg: '#E7E5E0', beard: true, tie: '#0B7E62', collar: '#fff' },
    coach: { skin: '#E4B08A', skinShade: '#c99266', hair: '#2a1a14', style: 'long', shirt: '#0B7E62', bg: '#DDEFE8', smile: 'wide' }
  };
  const SK = ['#E0AC82', '#D89B75', '#C98E66', '#E7B48F', '#B98259'], HR = ['#1b1b22', '#2a1b1b', '#3a2418', '#15151a'], ST = ['short', 'long', 'side', 'curly', 'bun'], SH = ['#0B7E62', '#B3282D', '#3F5A86', '#D68A0A', '#6B4FBB', '#26262e'], BG = ['#DDEFE8', '#F6DCDD', '#DFE8F6', '#FBEBCB', '#EAE4F7', '#E7E5E0'];
  for (let i = 0; i < 40; i++) D.people['u' + i] = { skin: SK[i % 5], skinShade: '#00000022', hair: HR[(i * 3) % 4], style: ST[(i * 7) % 5], shirt: SH[(i * 5) % 6], bg: BG[(i * 11) % 6], glasses: i % 5 === 2, beard: i % 7 === 3, bindi: i % 5 === 1 };

  D.student = { name: 'Aarav Sharma', first: 'Aarav', email: 'aarav.sharma@example.com', phone: '+91 98765 43210', city: 'Pune', batch: 'AWS DevOps · Sept 2026', pwd: 'Demo@1234' };
  D.admin = { name: 'Sneha Kulkarni', email: 'sneha.k@radical-demo.example', pwd: 'Admin@1234' };

  /* ---------- student skills (0..1 strength) ---------- */
  D.skills = { Linux: .9, AWS: .85, Docker: .8, Git: .9, Python: .7, Bash: .7, Jenkins: .6, 'CI/CD': .65, Networking: .6, SQL: .55, Terraform: .4, Kubernetes: .4, Prometheus: .3, Grafana: .3, Java: .3, Security: .3, Ansible: .2, Azure: .2, Spark: .1, Splunk: .1, ITIL: .3, 'Shell scripting': .7 };
  D.wishlist = { roles: ['Cloud Engineer', 'DevOps Engineer', 'AWS Support Engineer'], cities: ['Pune', 'Bengaluru', 'Remote'], salary: [6, 9], exp: 'Fresher (0–1 yr)', mode: ['Hybrid', 'Onsite', 'Remote'], notice: 'Immediate' };

  /* ---------- job descriptions by kind ---------- */
  const KIND = {
    cloud: { resp: ['Provision and manage AWS infrastructure (EC2, VPC, S3, IAM, RDS) using infrastructure-as-code', 'Monitor workloads with CloudWatch and respond to alerts within SLA', 'Automate routine tasks with Python and shell scripts', 'Support application teams with deployments, cost optimisation and security best practices', 'Document runbooks and contribute to post-incident reviews'], nice: ['AWS Certified Solutions Architect – Associate', 'Exposure to Terraform or CloudFormation'] },
    devops: { resp: ['Build and maintain CI/CD pipelines (Jenkins / GitHub Actions) for multiple services', 'Containerise applications with Docker and deploy them to Kubernetes clusters', 'Write infrastructure-as-code with Terraform and Ansible', 'Set up monitoring, logging and alerting (Prometheus, Grafana, ELK)', 'Work with developers to shorten release cycles and improve reliability'], nice: ['Kubernetes (CKA) certification', 'Experience with GitOps tools such as ArgoCD'] },
    support: { resp: ['Provide first- and second-line support for cloud customers over chat and email', 'Troubleshoot networking, permissions and compute issues on AWS', 'Reproduce customer problems in a lab environment and document fixes', 'Escalate complex issues to engineering with clear technical notes', 'Contribute to the internal knowledge base'], nice: ['AWS Cloud Practitioner or higher', 'Strong written English communication'] },
    sre: { resp: ['Define and track SLIs and SLOs for production services', 'Automate operational toil with Python and Bash', 'Participate in on-call rotation and lead blameless post-mortems', 'Improve observability using Prometheus, Grafana and distributed tracing', 'Capacity planning and performance tuning of Linux systems'], nice: ['Experience with Kubernetes in production', 'Understanding of distributed-systems basics'] },
    python: { resp: ['Write Python automation for infrastructure, reporting and data movement', 'Build small internal tools and REST APIs with Flask or FastAPI', 'Write unit tests and maintain code quality with code reviews', 'Integrate with AWS services using boto3', 'Work with SQL databases and simple ETL jobs'], nice: ['Experience with Docker', 'Basic understanding of CI/CD'] },
    linux: { resp: ['Administer RHEL/Ubuntu servers: patching, users, storage, backups', 'Monitor system health and resolve incidents per ITIL process', 'Write shell scripts to automate repetitive administration', 'Manage DNS, DHCP, firewall rules and access control', 'Maintain asset and change records'], nice: ['RHCSA certification', 'Exposure to Ansible'] },
    security: { resp: ['Monitor security alerts in the SIEM and triage incidents', 'Run vulnerability scans and track remediation', 'Review cloud IAM policies and configurations for risk', 'Prepare incident reports and playbooks', 'Support audits and compliance evidence collection'], nice: ['CEH or Security+ certification', 'Understanding of AWS security services'] },
    data: { resp: ['Build and monitor data pipelines using Python and SQL', 'Load data to S3 and Redshift; maintain schedules in Airflow', 'Validate data quality and fix failed jobs', 'Support analysts with cleaned datasets', 'Document data flows and lineage'], nice: ['Spark or PySpark exposure', 'AWS Glue or Athena'] }
  };
  const ABOUT = ['is a global technology company helping enterprises modernise and run their platforms on the cloud.', 'builds engineering-led digital products for customers across banking, retail and healthcare.', 'runs a fast-growing cloud and platform engineering practice with teams across India.', 'partners with leading enterprises on cloud migration, DevOps and managed services.'];
  const mk = (id, title, company, city, mode, lo, hi, exp, src, posted, skills, kind, extra) => Object.assign({ id, title, company, city, mode, lo, hi, exp, src, posted, skills, kind }, extra || {});
  const J = [
    mk('j1', 'Cloud Engineer – AWS', 'Persistent Systems', 'Pune', 'Hybrid', 6, 9, '0–2 yrs', 'radical', 1, ['AWS', 'Linux', 'Python', 'Terraform', 'Docker', 'Git'], 'cloud', { hot: 1 }),
    mk('j2', 'DevOps Engineer (Fresher)', 'Thoughtworks', 'Pune', 'Hybrid', 7, 10, '0–1 yr', 'site', 2, ['Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'Linux', 'Git'], 'devops'),
    mk('j3', 'Associate Cloud Support Engineer', 'Amazon Web Services', 'Bengaluru', 'Onsite', 8, 12, '0–1 yr', 'linkedin', 1, ['AWS', 'Linux', 'Networking', 'Troubleshooting', 'Python'], 'support', { hot: 1 }),
    mk('j4', 'Junior Site Reliability Engineer', 'BNY Mellon', 'Pune', 'Hybrid', 8, 11, '1–3 yrs', 'site', 3, ['Linux', 'Python', 'Prometheus', 'Grafana', 'Kubernetes', 'Bash'], 'sre'),
    mk('j5', 'Cloud Operations Analyst', 'Cognizant', 'Pune', 'Onsite', 4.5, 6.5, '0–1 yr', 'naukri', 2, ['AWS', 'Linux', 'ITIL', 'Networking', 'Shell scripting'], 'support'),
    mk('j6', 'DevOps Engineer', 'Zensar Technologies', 'Pune', 'Hybrid', 6, 9, '1–3 yrs', 'indeed', 4, ['Jenkins', 'Docker', 'Ansible', 'AWS', 'Git', 'CI/CD'], 'devops'),
    mk('j7', 'Python Automation Engineer', 'Cybage Software', 'Pune', 'Onsite', 5, 7.5, '0–2 yrs', 'naukri', 1, ['Python', 'SQL', 'Linux', 'Git', 'Bash'], 'python'),
    mk('j8', 'Cloud Platform Engineer', 'Accenture', 'Bengaluru', 'Hybrid', 7, 10, '0–2 yrs', 'linkedin', 5, ['AWS', 'Terraform', 'Kubernetes', 'Python', 'CI/CD', 'Linux'], 'cloud'),
    mk('j9', 'Linux System Administrator', 'Tech Mahindra', 'Pune', 'Onsite', 4, 6, '0–2 yrs', 'naukri', 3, ['Linux', 'Shell scripting', 'Networking', 'ITIL', 'Ansible'], 'linux'),
    mk('j10', 'AWS DevOps Trainee', 'Nimbus Cloudworks', 'Pune', 'Hybrid', 4.8, 6, '0–1 yr', 'radical', 0, ['AWS', 'Docker', 'Jenkins', 'Git', 'Linux'], 'devops', { hot: 1, partner: 1 }),
    mk('j11', 'Site Reliability Engineer', 'Nagarro', 'Remote', 'Remote', 9, 13, '2–4 yrs', 'linkedin', 6, ['Kubernetes', 'Terraform', 'Prometheus', 'Python', 'AWS', 'Linux'], 'sre'),
    mk('j12', 'Cloud Support Associate', 'Infosys', 'Pune', 'Hybrid', 4.5, 6, '0–1 yr', 'site', 2, ['AWS', 'Azure', 'Linux', 'Networking', 'ITIL'], 'support'),
    mk('j13', 'Infrastructure Engineer', 'IBM India', 'Bengaluru', 'Onsite', 6, 8.5, '0–2 yrs', 'site', 7, ['Linux', 'Ansible', 'AWS', 'Networking', 'Bash', 'Git'], 'linux'),
    mk('j14', 'Junior Data Engineer', 'Quantiphi', 'Mumbai', 'Hybrid', 6.5, 9, '0–2 yrs', 'linkedin', 4, ['Python', 'SQL', 'AWS', 'Spark', 'Airflow'], 'data'),
    mk('j15', 'CI/CD Release Engineer', 'KPIT Technologies', 'Pune', 'Hybrid', 5.5, 8, '1–2 yrs', 'indeed', 3, ['Jenkins', 'Git', 'CI/CD', 'Docker', 'Bash', 'Linux'], 'devops'),
    mk('j16', 'Azure Cloud Engineer', 'Capgemini', 'Pune', 'Hybrid', 6, 9, '1–3 yrs', 'naukri', 5, ['Azure', 'Terraform', 'Linux', 'Networking', 'Git'], 'cloud'),
    mk('j17', 'Junior SOC Analyst', 'Deloitte', 'Bengaluru', 'Onsite', 5, 7.5, '0–1 yr', 'linkedin', 2, ['Security', 'Splunk', 'Networking', 'Linux', 'Python'], 'security'),
    mk('j18', 'Cloud Engineer (Kochi)', 'UST', 'Kochi', 'Hybrid', 5, 7.5, '0–2 yrs', 'site', 3, ['AWS', 'Linux', 'Docker', 'Python', 'Git'], 'cloud'),
    mk('j19', 'Platform Engineer – Kubernetes', 'Barclays', 'Pune', 'Hybrid', 9, 13, '2–4 yrs', 'site', 8, ['Kubernetes', 'Terraform', 'Docker', 'Prometheus', 'Linux', 'CI/CD'], 'devops'),
    mk('j20', 'Technical Support Engineer – Cloud', 'Microsoft India', 'Hyderabad', 'Onsite', 8, 12, '0–2 yrs', 'linkedin', 3, ['Azure', 'AWS', 'Networking', 'Linux', 'Troubleshooting'], 'support'),
    mk('j21', 'DevOps Intern → Full-time', 'LTIMindtree', 'Mumbai', 'Hybrid', 4, 5.5, '0–1 yr', 'naukri', 1, ['Docker', 'Jenkins', 'Linux', 'Git', 'AWS'], 'devops'),
    mk('j22', 'Cloud Infrastructure Engineer', 'Wipro', 'Bengaluru', 'Hybrid', 5.5, 8, '0–2 yrs', 'indeed', 6, ['AWS', 'Terraform', 'Linux', 'Ansible', 'Networking'], 'cloud')
  ];
  const SRC = { site: 'Company site', naukri: 'Naukri', linkedin: 'LinkedIn', indeed: 'Indeed', radical: 'Radical partner' };
  J.forEach((j, n) => {
    const lv = j.skills.map(s => D.skills[s] != null ? D.skills[s] : .15);
    const avg = lv.reduce((a, b) => a + b, 0) / lv.length;
    let m = 42 + avg * 52 + (D.wishlist.cities.includes(j.city) ? 3 : -4) + (D.wishlist.roles.some(r => j.title.toLowerCase().includes(r.split(' ')[0].toLowerCase())) ? 3 : 0);
    if (j.lo >= 6 && j.hi <= 12) m += 1;
    j.match = Math.max(48, Math.min(97, Math.round(m)));
    j.have = j.skills.filter(s => (D.skills[s] || 0) >= .55);
    j.gaps = j.skills.filter(s => (D.skills[s] || 0) < .55);
    j.srcLabel = SRC[j.src];
    j.url = 'external.html?job=' + j.id;
    j.about = j.company + ' ' + ABOUT[n % 4];
    j.resp = KIND[j.kind].resp; j.nice = KIND[j.kind].nice;
    j.reasons = [];
    if (j.have.length) j.reasons.push('You already have ' + j.have.slice(0, 3).join(', ') + (j.have.length > 3 ? ' +' + (j.have.length - 3) : ''));
    if (D.wishlist.cities.includes(j.city)) j.reasons.push(j.city + ' is on your preferred locations');
    if (j.lo <= D.wishlist.salary[1] && j.hi >= D.wishlist.salary[0]) j.reasons.push('Salary ₹' + j.lo + '–' + j.hi + ' LPA overlaps your ₹6–9 LPA expectation');
    if (j.gaps.length) j.reasons.push('Gap to close: ' + j.gaps.slice(0, 2).join(', '));
  });
  J.sort((a, b) => b.match - a.match);
  D.jobs = J; D.jobById = id => J.find(j => j.id === id);
  D.srcLabel = SRC;

  /* ---------- Radical courses (sample catalogue) ---------- */
  D.courses = [
    { id: 'c1', title: 'AWS Certified Solutions Architect – Associate', cat: 'Cloud', hrs: 60, mode: 'Live online · Weekend', level: 'Intermediate', next: '5 Oct 2026', skills: ['AWS', 'Networking', 'Security'], color: '#D68A0A' },
    { id: 'c2', title: 'DevOps with Docker, Kubernetes & Terraform', cat: 'DevOps', hrs: 80, mode: 'Live online · Weekday', level: 'Intermediate', next: '28 Sep 2026', skills: ['Kubernetes', 'Terraform', 'Docker', 'CI/CD'], color: '#B3282D' },
    { id: 'c3', title: 'Kubernetes Administration (CKA Prep)', cat: 'DevOps', hrs: 40, mode: 'Classroom · Pune', level: 'Advanced', next: '12 Oct 2026', skills: ['Kubernetes'], color: '#3F5A86' },
    { id: 'c4', title: 'Python for Automation & Scripting', cat: 'Programming', hrs: 36, mode: 'Live online', level: 'Beginner', next: '1 Oct 2026', skills: ['Python', 'Bash'], color: '#0B7E62' },
    { id: 'c5', title: 'Data Structures & Algorithms with Python', cat: 'Programming', hrs: 40, mode: 'Live online', level: 'Intermediate', next: '3 Oct 2026', skills: ['Coding', 'Problem solving'], color: '#6B4FBB' },
    { id: 'c6', title: 'Interview & Career Skills Bootcamp', cat: 'Career', hrs: 16, mode: 'Live online · Weekend', level: 'All levels', next: '26 Sep 2026', skills: ['Communication', 'GD', 'HR round', 'Negotiation'], color: '#B3282D' },
    { id: 'c7', title: 'Business Communication & Presentation Lab', cat: 'Career', hrs: 20, mode: 'Classroom · Pune / Bengaluru', level: 'All levels', next: '4 Oct 2026', skills: ['Communication', 'Confidence'], color: '#D68A0A' },
    { id: 'c8', title: 'Aptitude & Reasoning Crash Course', cat: 'Career', hrs: 12, mode: 'Live online', level: 'Beginner', next: '27 Sep 2026', skills: ['Aptitude', 'Logical reasoning'], color: '#0B7E62' },
    { id: 'c9', title: 'Linux Administration (RHCSA)', cat: 'Systems', hrs: 48, mode: 'Live online', level: 'Beginner', next: '30 Sep 2026', skills: ['Linux'], color: '#26262e' },
    { id: 'c10', title: 'Microsoft Azure Administrator (AZ-104)', cat: 'Cloud', hrs: 56, mode: 'Live online', level: 'Intermediate', next: '8 Oct 2026', skills: ['Azure'], color: '#3F5A86' },
    { id: 'c11', title: 'Ethical Hacking & Cybersecurity', cat: 'Security', hrs: 60, mode: 'Classroom · Bengaluru', level: 'Intermediate', next: '15 Oct 2026', skills: ['Security'], color: '#8E1F24' },
    { id: 'c12', title: 'Data Engineering with Python & Spark', cat: 'Data', hrs: 72, mode: 'Live online', level: 'Intermediate', next: '10 Oct 2026', skills: ['Spark', 'SQL', 'Python'], color: '#4A8F2A' }
  ];
  D.courseById = id => D.courses.find(c => c.id === id);

  /* ---------- master resume ---------- */
  D.resume = {
    name: 'Aarav Sharma', title: 'Cloud & DevOps Engineer (Fresher)', contact: 'Pune, Maharashtra · +91 98765 43210 · aarav.sharma@example.com · linkedin.com/in/aarav-sharma-demo',
    summary: 'Cloud and DevOps fresher with hands-on AWS, Docker and CI/CD experience from a 3-month internship and three deployed projects. AWS Cloud Practitioner certified and currently completing Radical Technologies’ DevOps programme. Looking to start as a Cloud / DevOps Engineer.',
    skills: ['AWS (EC2, S3, VPC, IAM, RDS)', 'Linux', 'Docker', 'Jenkins', 'Git', 'Python', 'Bash', 'Terraform (learning)', 'Kubernetes (learning)', 'CI/CD', 'SQL'],
    exp: [{ role: 'DevOps Intern', org: 'Vertex Softworks, Pune', when: 'Jan 2026 – Mar 2026', pts: ['Automated build and deploy of 3 microservices with Jenkins, cutting release time from 45 to 12 minutes', 'Containerised a Flask application with Docker and deployed it to AWS EC2 behind an Application Load Balancer', 'Wrote Bash scripts to rotate logs and back up MySQL databases to S3', 'Set up CloudWatch alarms that reduced unnoticed downtime incidents'] }],
    projects: [{ name: 'Terraform-managed 3-tier AWS VPC', pts: ['Provisioned VPC, subnets, NAT gateway, EC2 and RDS with reusable Terraform modules', 'Documented cost estimate and least-privilege IAM roles'] }, { name: 'CI/CD pipeline for Node.js app', pts: ['GitHub → Jenkins → Docker Hub → EC2 pipeline with automated tests and Slack notifications'] }],
    edu: [{ deg: 'B.E. Computer Engineering', org: 'Savitribai Phule Pune University', when: '2021 – 2025', extra: 'CGPA 8.1 / 10' }],
    certs: ['AWS Certified Cloud Practitioner (CLF-C02)', 'Radical Technologies — DevOps with Docker, Kubernetes & Terraform (in progress)']
  };

  /* ---------- aptitude bank ---------- */
  D.aptitude = [
    { t: 'Quantitative', q: 'A train 150 m long passes a pole in 15 seconds. What is its speed?', o: ['8 m/s', '10 m/s', '12 m/s', '15 m/s'], a: 1, e: 'Speed = distance ÷ time = 150 ÷ 15 = 10 m/s.' },
    { t: 'Quantitative', q: 'If 20% of a number is 30, what is the number?', o: ['120', '150', '180', '200'], a: 1, e: '20% of x = 30 → x = 30 ÷ 0.2 = 150.' },
    { t: 'Quantitative', q: 'What number must be added to both terms of the ratio 3 : 5 to make it 5 : 7?', o: ['1', '2', '3', '4'], a: 1, e: '(3+x)/(5+x) = 5/7 → 21 + 7x = 25 + 5x → x = 2.' },
    { t: 'Quantitative', q: 'Simple interest on ₹8,000 at 5% per annum for 3 years is:', o: ['₹1,000', '₹1,200', '₹1,500', '₹1,600'], a: 1, e: 'SI = P×R×T/100 = 8000 × 5 × 3 / 100 = ₹1,200.' },
    { t: 'Quantitative', q: 'A can finish a job in 12 days and B in 18 days. Working together, how many days do they need?', o: ['6', '7.2', '8', '9'], a: 1, e: 'Combined rate = 1/12 + 1/18 = 5/36 per day → 36/5 = 7.2 days.' },
    { t: 'Quantitative', q: 'The average of 5 numbers is 24. If one number is removed, the average of the rest is 22. The removed number is:', o: ['28', '30', '32', '34'], a: 2, e: 'Total = 120; remaining total = 88; removed = 120 − 88 = 32.' },
    { t: 'Logical', q: 'Find the next number: 2, 6, 12, 20, 30, ?', o: ['40', '42', '44', '46'], a: 1, e: 'The terms are n × (n+1): 1·2, 2·3, 3·4, 4·5, 5·6, so next is 6·7 = 42.' },
    { t: 'Logical', q: 'Odd one out: Python, Java, Linux, C++', o: ['Python', 'Java', 'Linux', 'C++'], a: 2, e: 'Linux is an operating system; the others are programming languages.' },
    { t: 'Logical', q: 'If CLOUD is coded as DMPVE (each letter moved one step forward), how is LINUX coded?', o: ['MJOVY', 'MJNVY', 'KHMTW', 'MJOUY'], a: 0, e: 'L→M, I→J, N→O, U→V, X→Y gives MJOVY.' },
    { t: 'Logical', q: 'Pointing to a man, Riya said, “His mother is the only daughter of my mother.” How is the man related to Riya?', o: ['Brother', 'Son', 'Nephew', 'Father'], a: 1, e: 'The only daughter of Riya’s mother is Riya herself, so the man’s mother is Riya — he is her son.' },
    { t: 'Logical', q: 'A walks 5 km north, turns right and walks 3 km, then turns right and walks 5 km. How far is A from the start?', o: ['3 km', '5 km', '8 km', '13 km'], a: 0, e: 'After the two right turns A is 3 km east of the start, level with it: distance = 3 km.' },
    { t: 'Verbal', q: 'Choose the synonym of “meticulous”.', o: ['Careless', 'Thorough', 'Hasty', 'Vague'], a: 1, e: 'Meticulous means showing great attention to detail — thorough.' },
    { t: 'Verbal', q: 'Choose the correct sentence: “Neither of the candidates ___ selected.”', o: ['were', 'was', 'are', 'have been'], a: 1, e: '“Neither” takes a singular verb, so “was” is correct.' },
    { t: 'Verbal', q: 'Choose the antonym of “scarce”.', o: ['Abundant', 'Rare', 'Limited', 'Meagre'], a: 0, e: 'Scarce means in short supply; the opposite is abundant.' },
    { t: 'Verbal', q: 'Fill in the blank: “She insisted ___ paying the bill.”', o: ['in', 'on', 'at', 'for'], a: 1, e: 'The verb “insist” takes the preposition “on”.' }
  ];
  /* ---------- technical bank ---------- */
  D.technical = [
    { t: 'AWS', q: 'Which AWS service provides scalable object storage?', o: ['Amazon EBS', 'Amazon S3', 'Amazon RDS', 'Amazon DynamoDB'], a: 1, e: 'Amazon S3 is AWS’s object storage service. EBS is block storage, RDS is relational DB, DynamoDB is NoSQL.' },
    { t: 'Linux', q: 'Which command shows disk space usage of mounted filesystems in human-readable form?', o: ['du -sh', 'df -h', 'free -m', 'top'], a: 1, e: '`df -h` reports filesystem disk space; `du` measures directory usage, `free` memory, `top` processes.' },
    { t: 'Docker', q: 'Which command lists the running containers?', o: ['docker images', 'docker ps', 'docker run', 'docker logs'], a: 1, e: '`docker ps` lists running containers (add -a for all).' },
    { t: 'Git', q: 'You made a commit by mistake. Which command undoes it but keeps the changes staged?', o: ['git revert HEAD', 'git reset --soft HEAD~1', 'git checkout -- .', 'git reset --hard HEAD~1'], a: 1, e: '`git reset --soft HEAD~1` moves HEAD back one commit and keeps changes staged; --hard would discard them.' },
    { t: 'Kubernetes', q: 'What is the smallest deployable unit in Kubernetes?', o: ['Node', 'Pod', 'Deployment', 'Service'], a: 1, e: 'A Pod (one or more containers sharing network and storage) is the smallest deployable unit.' },
    { t: 'Terraform', q: 'Which Terraform command previews the changes that will be made?', o: ['terraform init', 'terraform plan', 'terraform apply', 'terraform destroy'], a: 1, e: '`terraform plan` shows the execution plan without changing infrastructure.' },
    { t: 'Networking', q: 'Which HTTP status code means “resource not found”?', o: ['200', '301', '404', '500'], a: 2, e: '404 Not Found. 200 is OK, 301 a permanent redirect, 500 an internal server error.' },
    { t: 'AWS', q: 'Which AWS service runs code without managing servers?', o: ['EC2', 'Lambda', 'EBS', 'Lightsail'], a: 1, e: 'AWS Lambda is the serverless compute service.' },
    { t: 'Python', q: 'What does len({1, 2, 2, 3}) return in Python?', o: ['4', '3', '2', 'Error'], a: 1, e: 'A set stores unique values, so {1, 2, 2, 3} is {1, 2, 3} → length 3.' },
    { t: 'CI/CD', q: 'Which of these is NOT a CI/CD tool?', o: ['Jenkins', 'GitHub Actions', 'GitLab CI', 'Grafana'], a: 3, e: 'Grafana is a monitoring/visualisation tool, not a CI/CD tool.' },
    { t: 'Linux', q: 'What does the permission mode 755 on a file mean?', o: ['Owner rwx, group r-x, others r-x', 'Owner rw-, group r--, others r--', 'Owner rwx, group rwx, others rwx', 'Owner r-x, group rwx, others r-x'], a: 0, e: '7 = rwx, 5 = r-x. So owner rwx, group r-x, others r-x.' },
    { t: 'AWS', q: 'Which practice is recommended for AWS IAM permissions?', o: ['Give admin access to everyone', 'Least privilege', 'Share the root access keys', 'Disable MFA for speed'], a: 1, e: 'Grant only the permissions required — the principle of least privilege.' }
  ];
  D.techShort = [
    { q: 'In your own words, what is the difference between a Docker image and a Docker container?', kw: [['image', 'template', 'blueprint', 'read-only'], ['container', 'running', 'instance'], ['layer', 'registry', 'build', 'process', 'isolated']], model: 'An image is a read-only, layered template (built from a Dockerfile and stored in a registry). A container is a running, isolated instance of an image with its own writable layer and process.' },
    { q: 'An EC2 fleet is idle most nights. Suggest two ways to reduce the cost.', kw: [['schedule', 'stop', 'auto scaling', 'scale'], ['reserved', 'savings plan', 'spot', 'right-size', 'rightsize', 'smaller instance'], ['monitor', 'cloudwatch', 'cost explorer', 'budget']], model: 'Use Auto Scaling or scheduled start/stop to switch off idle instances, right-size instance types, and cover steady load with Savings Plans / Spot. Track it with Cost Explorer and Budgets.' },
    { q: 'A website is unreachable from the internet. List the first three things you would check on AWS.', kw: [['security group', 'nacl', 'firewall'], ['route', 'internet gateway', 'igw', 'subnet', 'route table'], ['instance', 'status', 'dns', 'load balancer', 'health']], model: 'Check the instance/target health first, then security groups and NACLs (ports 80/443), then the route table / internet gateway and DNS or load-balancer settings.' }
  ];

  /* ---------- Group discussion script ---------- */
  D.gd = {
    topic: 'Should Indian IT companies mandate a five-day work-from-office policy?',
    minutes: 8,
    bots: { riya: { name: 'Riya', role: 'Corporate HR view', voice: 'riya' }, kabir: { name: 'Kabir', role: 'Data-driven analyst', voice: 'kabir' }, meera: { name: 'Meera', role: 'Inclusion & wellbeing', voice: 'meera' }, moderator: { name: 'Mr. Rao', role: 'Moderator', voice: 'moderator' } },
    turns: [
      { who: 'moderator', text: 'Good morning everyone, and welcome to the group discussion round. Today’s topic: should Indian IT companies mandate a five-day work-from-office policy? You have eight minutes. Please begin whenever you are ready.' },
      { who: 'riya', text: 'I will start. I believe a five-day office policy helps. Teams learn faster when they sit together, juniors pick up mentoring naturally, and culture is built face to face. Freshers especially struggle when they are isolated at home.' },
      { who: 'kabir', text: 'That is fair, Riya, but where is the data? Studies of hybrid teams show equal or better output with lower attrition. Commuting alone costs Pune and Bengaluru employees two to three hours a day. That is lost productivity.' },
      {
        who: 'you', prompt: 'Riya and Kabir disagree. Add your point or take a stand.', focus: 'Structure your view, acknowledge both sides, propose something concrete.', key: 't1',
        opts: {
          strong: { text: 'I would like to bridge both views. Riya is right that freshers learn faster with in-person mentoring, and Kabir is right that commuting drains time. A structured hybrid — three days in office for collaboration and mentoring, two remote days for focused work — captures both benefits. Companies should measure outcomes, not attendance.', s: { content: 86, comm: 88, lead: 84, team: 90, struct: 90 } },
          average: { text: 'Umm, I think both are, like, kind of correct. Basically office is good for learning but, you know, remote work is also good for saving time. So maybe it depends on the company.', s: { content: 52, comm: 45, lead: 42, team: 60, struct: 40 } },
          weak: { text: 'I think remote work is better because it is comfortable. Offices are boring and people can work from anywhere.', s: { content: 30, comm: 42, lead: 35, team: 30, struct: 28 } }
        },
        react: { strong: { who: 'riya', text: 'Interesting, a three-two hybrid sounds reasonable. But how would you make sure the office days are really used for mentoring and not just attendance?' }, average: { who: 'kabir', text: 'Could you be more specific? “It depends” does not move the discussion forward. What would you decide, and why?' }, weak: { who: 'riya', text: 'Comfort is not a business argument. Can you back that with any evidence about productivity?' } }
      },
      { who: 'meera', text: 'I want to add a different angle. Not everyone can relocate or afford city rent. Remote and hybrid options widen the talent pool to tier-two cities, and women returning from career breaks benefit a lot. A blanket five-day rule can hurt diversity.' },
      { who: 'kabir', text: 'True, Meera. But let us be careful. Support roles and client-facing projects often need physical presence. Perhaps the policy should be by role, not one rule for all.' },
      {
        who: 'you', prompt: 'Meera and Kabir suggest a role-based policy. Respond or build on it.', focus: 'Build on others, give a concrete example, keep the tone collaborative.', key: 't2',
        opts: {
          strong: { text: 'I agree with role-based flexibility, and I would make it concrete. Customer-facing and onboarding roles could be mostly on-site, while engineering teams set team-level agreements. And to Meera’s point on diversity, a company can review attrition and hiring-pool data every quarter and adjust, which keeps the policy evidence-based.', s: { content: 88, comm: 86, lead: 82, team: 92, struct: 86 } },
          average: { text: 'Yes I agree with Kabir. Role based is good. Also what Meera said is good, that is also important point.', s: { content: 45, comm: 50, lead: 38, team: 62, struct: 40 } },
          weak: { text: 'No, I disagree, everyone should just work from home. The office is a waste of money and everyone knows it.', s: { content: 28, comm: 30, lead: 40, team: 15, struct: 30 } }
        },
        react: { strong: { who: 'meera', text: 'Exactly, and reviewing the data every quarter keeps it fair for everyone.' }, average: { who: 'riya', text: 'Could you add one example or a number to support that? It would make your point stronger.' }, weak: { who: 'moderator', text: 'Please let others finish, and keep the tone respectful. Try to support your points with reasons rather than absolutes.' } }
      },
      { who: 'riya', text: 'Let me push back once more. From the company’s view, the office space is already paid for, and trust-based remote work is hard to audit for new joiners. How would you handle onboarding?' },
      {
        who: 'you', prompt: 'Riya asks how onboarding should work. Answer her question directly.', focus: 'Answer the question that was asked, with a clear proposal.', key: 't3',
        opts: {
          strong: { text: 'For onboarding I would suggest the first four weeks fully on-site with a buddy system and structured checkpoints, then move to hybrid. Freshers get mentoring, the company gets visibility, and after week four the flexibility is earned through trust.', s: { content: 90, comm: 88, lead: 80, team: 82, struct: 92 } },
          average: { text: 'Onboarding can be done online also. We can do video calls and it will be fine, no problem.', s: { content: 42, comm: 52, lead: 40, team: 50, struct: 38 } },
          weak: { text: 'I don’t know, maybe they can figure it out themselves.', s: { content: 18, comm: 30, lead: 20, team: 30, struct: 20 } }
        },
        react: { strong: { who: 'riya', text: 'That is practical. I can support that — four weeks on-site, then hybrid.' }, average: { who: 'kabir', text: 'Video-only onboarding has a poor record for freshers, but noted.' }, weak: { who: 'kabir', text: 'Let us move on then.' } }
      },
      { who: 'moderator', text: 'Two minutes remaining. Let us begin summarising. I would like to hear from you first, then the others.' },
      {
        who: 'you', prompt: 'Give your closing summary of the discussion.', focus: 'Summarise every view, state the common ground, end with a clear conclusion.', key: 't4',
        opts: {
          strong: { text: 'To summarise: Riya highlighted mentoring and culture, Kabir highlighted productivity data and commuting, and Meera raised inclusion. Our common ground is a role-based hybrid policy — four weeks on-site for onboarding, then three days on-site and two remote — reviewed quarterly against productivity and attrition data.', s: { content: 92, comm: 90, lead: 92, team: 92, struct: 94 } },
          average: { text: 'So in the end we all agreed hybrid is good. Thank you.', s: { content: 40, comm: 50, lead: 42, team: 55, struct: 38 } },
          weak: { text: 'That is all I have. I already said what I wanted.', s: { content: 15, comm: 32, lead: 15, team: 25, struct: 15 } }
        },
        react: { strong: null, average: null, weak: null }
      },
      { who: 'riya', text: 'I would conclude with hybrid, backed by strong on-site onboarding.' },
      { who: 'kabir', text: 'Agreed, with data-based reviews every quarter.' },
      { who: 'meera', text: 'And real flexibility for those who need it.' },
      { who: 'moderator', text: 'Thank you all. That was a lively discussion. Time. Your evaluation will be ready in a moment.' }
    ],
    feedback: {
      t1: {
        strong: { issue: 'Well structured: acknowledged both speakers, proposed a specific model (3 + 2 days) and a measurable principle. Small gap: no supporting number or example.', better: 'Add one proof point: “Teams with two remote days show lower attrition in several studies, while in-person days speed up mentoring.”', next: 'Practise adding one statistic or example to every argument.' },
        average: { issue: 'Fillers (“umm”, “like”, “basically”, “you know”) weaken authority, and “it depends” avoids taking a stand. Content is generic and has no structure.', better: 'Riya is right that freshers learn faster in person, and Kabir is right that commuting costs time. So I propose three office days and two remote days, judged by outcomes.', next: 'Use a 3-step frame: acknowledge → position → reason. Record yourself and count fillers.' },
        weak: { issue: 'Opinion without reasons (“comfortable”, “boring”) and it ignores the other speakers’ points. Sounds dismissive of the business case.', better: 'Remote work can raise productivity by cutting commute time, though juniors still need in-person mentoring — so a hybrid model balances both.', next: 'Always give a reason and refer to what others said before stating your view.' }
      },
      t2: {
        strong: { issue: 'Excellent: built on two speakers, made it concrete (role types), and linked to a data review cycle.', better: 'To sharpen further, name one metric: “attrition and time-to-productivity for freshers”.', next: 'Keep referencing colleagues by name — it shows listening.' },
        average: { issue: 'Agreed without adding anything new. Repeating “good” and “important” is filler; it adds no value to the discussion.', better: 'I agree with role-based rules — for example, client-facing roles on-site and engineering teams hybrid — and Meera’s inclusion point can be tracked through hiring-pool data.', next: 'When you agree, add one example, number or extension.' },
        weak: { issue: 'Absolute language (“everyone”, “waste”) and dismissing others’ views triggered a moderator warning. Interrupting or being blunt lowers teamwork and leadership scores.', better: 'I see the case for role-based rules, though I would go further and make remote the default for engineering roles, because output matters more than location.', next: 'Disagree respectfully: “I see your point, however…”. Avoid absolutes.' }
      },
      t3: {
        strong: { issue: 'Directly answered the question with a clear plan (4 weeks on-site, buddy system, checkpoints).', better: 'Add how success is measured: “time to first production commit”.', next: 'Keep answers structured: proposal → why it works → how to measure.' },
        average: { issue: 'Dismissed the concern (“no problem”) instead of solving it. No plan for trust, audit or mentoring.', better: 'Onboarding needs mentoring, so I would keep the first four weeks on-site with a buddy, then shift to hybrid once checkpoints are met.', next: 'Address objections seriously — restate the concern, then answer it.' },
        weak: { issue: '“I don’t know” ends your contribution. In a GD, silence or deflection is scored very low, even when you are unsure.', better: 'I am not sure of the best model, but a buddy system with weekly check-ins would help new joiners settle in.', next: 'Never say “I don’t know”. Say what you do know, then suggest a direction.' }
      },
      t4: {
        strong: { issue: 'Model closing: named every speaker, found common ground and ended with a decision.', better: 'Keep it under 30 seconds and end with a one-line conclusion.', next: 'Maintain this — a strong summary is remembered by evaluators.' },
        average: { issue: 'The summary is too short and does not reflect what each person said. It lacks a conclusion.', better: 'Riya stressed mentoring, Kabir data and Meera inclusion; together we agree on a role-based hybrid policy with a strong on-site onboarding period.', next: 'Use the pattern: view 1 + view 2 + view 3 → common ground → conclusion.' },
        weak: { issue: 'Missed the closing opportunity entirely — a summary is a leadership moment and scores heavily.', better: 'To summarise, we agreed a hybrid policy works best, with on-site onboarding and quarterly reviews.', next: 'Prepare a 3-line closing template you can use in any GD.' }
      }
    }
  };

  /* ---------- Coding round ---------- */
  D.coding = [
    {
      id: 'p1', title: 'Two Sum', diff: 'Easy', fn: 'two_sum', jsfn: 'twoSum',
      desc: 'Given an array of integers <code>nums</code> and an integer <code>target</code>, return the indices of the two numbers that add up to <code>target</code>. Each input has exactly one solution, and you may not use the same element twice.',
      ex: 'Input: nums = [2, 7, 11, 15], target = 9\nOutput: [0, 1]\nBecause nums[0] + nums[1] == 9',
      constraints: ['2 ≤ nums.length ≤ 100,000', '−10⁹ ≤ nums[i] ≤ 10⁹', 'Exactly one valid answer exists'],
      py: 'def two_sum(nums, target):\n    # Return indices of the two numbers that add up to target\n    for i in range(len(nums)):\n        for j in range(i + 1, len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]\n    return []\n',
      js: 'function twoSum(nums, target) {\n  // Return indices of the two numbers that add up to target\n  for (let i = 0; i < nums.length; i++) {\n    for (let j = i + 1; j < nums.length; j++) {\n      if (nums[i] + nums[j] === target) return [i, j];\n    }\n  }\n  return [];\n}\n',
      pyOpt: 'def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        need = target - n\n        if need in seen:\n            return [seen[need], i]\n        seen[n] = i\n    return []\n',
      jsOpt: 'function twoSum(nums, target) {\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const need = target - nums[i];\n    if (seen.has(need)) return [seen.get(need), i];\n    seen.set(nums[i], i);\n  }\n  return [];\n}\n',
      tests: [{ n: 'Example 1', a: [[2, 7, 11, 15], 9], e: [0, 1] }, { n: 'Example 2', a: [[3, 2, 4], 6], e: [1, 2] }, { n: 'Duplicates', a: [[3, 3], 6], e: [0, 1] }, { n: 'Negative numbers', a: [[-1, -2, -3, -4, -5], -8], e: [2, 4] }]
    },
    {
      id: 'p2', title: 'Valid Parentheses', diff: 'Easy', fn: 'is_valid', jsfn: 'isValid',
      desc: 'Given a string <code>s</code> containing just the characters <code>()[]{}</code>, determine whether the input is valid. Brackets must be closed by the same type and in the correct order.',
      ex: 'Input: s = "()[]{}"  →  true\nInput: s = "(]"  →  false',
      constraints: ['1 ≤ s.length ≤ 10,000'],
      py: 'def is_valid(s):\n    # Return True if the brackets are balanced\n    stack = []\n    pairs = {")": "(", "]": "[", "}": "{"}\n    for ch in s:\n        pass  # TODO\n    return False\n',
      js: 'function isValid(s) {\n  // Return true if the brackets are balanced\n  const stack = [];\n  const pairs = { ")": "(", "]": "[", "}": "{" };\n  for (const ch of s) {\n    // TODO\n  }\n  return false;\n}\n',
      pyOpt: 'def is_valid(s):\n    stack = []\n    pairs = {")": "(", "]": "[", "}": "{"}\n    for ch in s:\n        if ch in pairs:\n            if not stack or stack.pop() != pairs[ch]:\n                return False\n        else:\n            stack.append(ch)\n    return not stack\n',
      jsOpt: 'function isValid(s) {\n  const stack = [];\n  const pairs = { ")": "(", "]": "[", "}": "{" };\n  for (const ch of s) {\n    if (pairs[ch]) {\n      if (!stack.length || stack.pop() !== pairs[ch]) return false;\n    } else stack.push(ch);\n  }\n  return stack.length === 0;\n}\n',
      tests: [{ n: 'Simple', a: ['()'], e: true }, { n: 'Mixed', a: ['()[]{}'], e: true }, { n: 'Wrong order', a: ['(]'], e: false }, { n: 'Nested', a: ['{[()]}'], e: true }, { n: 'Unclosed', a: ['(('], e: false }]
    }
  ];

  /* ---------- HR round ---------- */
  D.hr = [
    { q: 'Let us start simply — could you tell me about yourself?', tag: 'Introduction', opts: {
      strong: 'I am Aarav, a Computer Engineering graduate from Pune who has focused on cloud and DevOps. During a three-month internship I automated deployments with Jenkins and cut release time from 45 to 12 minutes, and I am AWS Cloud Practitioner certified. I enjoy automating repetitive work, and I am now looking for a cloud engineering role where I can grow.',
      average: 'I am Aarav. I completed engineering in computers and I did an internship in DevOps. I know some AWS and Docker and I am learning more. I am a hard-working person and I want a job in cloud.',
      weak: 'Umm, my name is Aarav, I am from Pune, I have done B.E. and I am looking for any job in IT.' },
      fb: { strong: ['Clear present–past–future structure with a quantified result.', 'Add one line on why this company.'], average: ['Facts are correct but generic; “hard-working” is a claim without proof.', 'Replace generic traits with one achievement and a number.'], weak: ['Too short, filler at the start, and “any job” signals lack of direction.', 'State your target role and one proof point.'] },
      react: { strong: 'That was a crisp introduction, thank you.', average: 'Okay. Could you tell me one specific thing you built?', weak: 'Hmm. Which kind of role are you actually targeting?' } },
    { q: 'Why do you want to join our company, and why this role?', tag: 'Motivation', opts: {
      strong: 'Your cloud platform team runs large AWS workloads, which matches the projects I have built and the certification I hold. This role would let me apply my Terraform and CI/CD skills on production systems, and Persistent’s engineering training programme is the kind of structured growth I am looking for.',
      average: 'Your company is very big and reputed, and the salary and growth are good. I also want to work in cloud.',
      weak: 'I need a job urgently, and my friend told me your company is good.' },
      fb: { strong: ['Linked your skills to the role and showed you researched the company.', 'Mention a specific product or team for extra impact.'], average: ['Reasons are about the company’s size and pay, not about your fit.', 'Connect one of your projects to their work.'], weak: ['Urgency and hearsay show no research and lower confidence in you.', 'Research the company for 15 minutes and cite two specific facts.'] },
      react: { strong: 'Good. You clearly did your homework.', average: 'I see. What exactly attracts you to our cloud practice?', weak: 'Understood. Let us move on.' } },
    { q: 'Tell me about a challenge you faced in a project and how you handled it.', tag: 'Behavioural (STAR)', opts: {
      strong: 'During my internship, a deployment kept failing on the staging server (Situation). I was asked to fix it before a demo (Task). I checked the Jenkins logs, found a missing environment variable and a port conflict, wrote a health-check script and documented the fix (Action). Deployments then passed every time and the demo went ahead on schedule (Result).',
      average: 'Once my deployment failed. I searched on Google and asked my mentor, then it worked after some time.',
      weak: 'I never faced a big challenge. Everything went smoothly in my projects.' },
      fb: { strong: ['A textbook STAR answer with a measurable outcome.', 'Add what you would do to prevent it next time.'], average: ['No structure — the situation, your action and the result are all vague.', 'Use STAR: Situation, Task, Action, Result — with one number.'], weak: ['Saying you faced no challenges sounds unrealistic and hides your problem-solving.', 'Prepare two real challenges from projects or college.'] },
      react: { strong: 'That is exactly the ownership we look for.', average: 'Could you walk me through what you actually did?', weak: 'Really? Every candidate has faced something. Please think about it again later.' } },
    { q: 'What are your key strengths, and what is one weakness you are working on?', tag: 'Self-awareness', opts: {
      strong: 'My strength is learning quickly and automating repetitive work — I built three pipelines during my learning. My weakness is that I sometimes spend too long polishing scripts; I now time-box tasks and ask for review earlier.',
      average: 'My strength is hard work and my weakness is that I am a perfectionist.',
      weak: 'I have no weakness. I am good at everything.' },
      fb: { strong: ['Real strength with proof, real weakness with an action plan.', 'Keep the weakness unrelated to core job skills.'], average: ['“Perfectionist” is a cliché that interviewers hear all the time.', 'Choose a genuine weakness and explain the fix.'], weak: ['Claiming no weakness reads as low self-awareness.', 'Prepare one honest, minor weakness and your improvement plan.'] },
      react: { strong: 'Good balance and honesty.', average: 'A perfectionist? Can you give an example of that?', weak: 'Everyone has areas to improve. Please reflect on that.' } },
    { q: 'Describe a time you disagreed with a teammate. What did you do?', tag: 'Teamwork', opts: {
      strong: 'In a college project a teammate wanted to store data in files while I proposed a database. Instead of arguing, we listed pros and cons and tested both with sample data. The database was faster for our queries, and he agreed. We documented the decision and I credited his benchmarking idea.',
      average: 'We had a disagreement but I explained my idea and finally they agreed with me.',
      weak: 'I do not like arguments, so I just do the work myself.' },
      fb: { strong: ['Fact-based resolution, respectful tone and shared credit.', 'Mention the learning you took away.'], average: ['The story has no detail; “they agreed with me” sounds like you always win.', 'Show that you listened and compromised.'], weak: ['Avoiding conflict and working alone signals poor collaboration.', 'Prepare an example where you resolved a difference constructively.'] },
      react: { strong: 'I like how you used data to settle it.', average: 'What did the other person think?', weak: 'Teamwork matters a lot here. Think about an example for later.' } },
    { q: 'Where do you see yourself in five years?', tag: 'Career goals', opts: {
      strong: 'In five years I want to be a strong cloud engineer with an AWS Professional certification, leading small automation and platform initiatives, and mentoring new joiners. I would like to grow toward a senior DevOps / SRE role within this organisation.',
      average: 'I want to become a manager in five years, and earn a good salary.',
      weak: 'I do not know. Maybe I will do MBA or go abroad.' },
      fb: { strong: ['Ambitious yet realistic, and aligned to the role.', 'Link it to how you will learn (certifications, projects).'], average: ['Focuses on title and pay, not on skills or contribution.', 'Frame goals around skills and impact.'], weak: ['Signals you may leave soon; interviewers worry about retention.', 'Show commitment: state a growth path inside the role.'] },
      react: { strong: 'Great, that aligns well with our growth path.', average: 'Management comes with skills first. What skills will you build?', weak: 'Hmm, we look for people who plan to grow with us.' } },
    { q: 'Are you comfortable with relocation, rotational shifts and a 2-year service agreement?', tag: 'Logistics', opts: {
      strong: 'Yes, I am open to relocation and rotational shifts. Regarding the service agreement, I would like to read the terms first, but I am committed to a long-term career here and expect to stay well beyond two years.',
      average: 'Shifts are okay but I do not want relocation, only Pune. Bond is also a problem.',
      weak: 'No, I cannot do night shifts or a bond. I will only work in day shift.' },
      fb: { strong: ['Flexible, polite and transparent about reading the agreement.', 'Good — ask for the terms in writing.'], average: ['Too many restrictions reduce your options; be selective but constructive.', 'State preferences without ultimatums.'], weak: ['Blanket refusals at fresher level rarely work.', 'Say what you can do and ask what flexibility exists.'] },
      react: { strong: 'Thank you, that is helpful to know.', average: 'We will note your location preference.', weak: 'Understood. That could be a constraint for this role.' } },
    { q: 'Finally, do you have any questions for us?', tag: 'Closing', opts: {
      strong: 'Yes, two questions: what does the first 90 days look like for a new cloud engineer here, and how does the team measure success for freshers? Also, which AWS certifications does the company sponsor?',
      average: 'What is the salary and when will I get the result?',
      weak: 'No questions from my side.' },
      fb: { strong: ['Smart questions showing interest in growth and expectations.', 'Ask at most three questions.'], average: ['Salary and result timing are fair but should not be the only questions.', 'Ask about role, team and growth first.'], weak: ['“No questions” can look like low interest.', 'Prepare two thoughtful questions about the role and team.'] },
      react: { strong: 'Excellent questions. Thank you for your time, Aarav.', average: 'We will share the result within a week. Thank you.', weak: 'Alright. Thank you for your time.' } }
  ];

  /* ---------- Salary negotiation ---------- */
  D.salary = {
    company: 'Persistent Systems', role: 'Cloud Engineer – AWS', offer: 6.2, band: [6.8, 8.5], expect: 8,
    steps: [
      { who: 'vikram', text: 'Congratulations, Aarav! After your interview rounds we would like to offer you the Cloud Engineer role at ₹6.2 LPA fixed with a ₹40,000 joining bonus. How does that sound?', key: 's1', prompt: 'React to the offer.',
        opts: {
          strong: { text: 'Thank you, I am very excited about the role. Based on my AWS certification, the two projects I have deployed and current market data for Pune cloud roles — around ₹6.8 to ₹8.5 LPA — I was expecting closer to ₹8 LPA. Is there flexibility on the fixed component?', add: .8 },
          average: { text: 'It is a bit low. Can you increase it?', add: .2 },
          weak: { text: 'Okay, I accept, I really need this job.', add: 0, end: true }
        },
        react: { strong: 'Thank you for sharing the data — that is helpful. I can go to ₹7.0 LPA fixed based on your profile. Would that work?', average: 'I can check with the hiring manager. Perhaps ₹6.4 LPA is possible. What is your expectation?', weak: 'Wonderful, welcome aboard at ₹6.2 LPA. I will send the offer letter today.' } },
      { who: 'vikram', text: '', key: 's2', prompt: 'Respond to the counter-offer.',
        opts: {
          strong: { text: 'I appreciate the move to ₹7.0. If we can reach ₹7.6 with a six-month performance review, I am ready to sign this week.', add: .4 },
          average: { text: 'Then give me ₹8 or I will look at other offers.', add: 0 },
          weak: { text: 'Fine, ₹7.0 is okay.', add: 0, end: true }
        },
        react: { strong: 'That is a reasonable structure. I can offer ₹7.4 LPA with a review at six months. Shall I proceed?', average: 'I understand, but ₹8 is beyond the band for freshers. The best I can do is what I have offered.', weak: 'Great, ₹7.0 LPA it is. I will prepare the letter.' } },
      { who: 'vikram', text: '', key: 's3', prompt: 'Close the conversation.',
        opts: {
          strong: { text: 'That works for me. Thank you for the flexibility, Vikram. Could you please share the revised offer with the review clause in writing? I will confirm by Friday.', add: 0 },
          average: { text: 'Okay, send the letter.', add: 0 },
          weak: { text: 'Hmm, I will think about it and maybe tell you later.', add: -.2 }
        },
        react: { strong: 'Absolutely, I will send it in writing today. Looking forward to having you on the team.', average: 'Sure, I will send it across.', weak: 'Please let us know within three days, as we have other candidates.' } }
    ],
    fb: {
      s1: { strong: ['Anchored high with evidence (certification, projects, market band) and stayed polite.', 'Perfect — ask “is there flexibility?” instead of demanding.'], average: ['Asking to “increase” without a reason gives the recruiter nothing to justify.', 'Cite your value: skills, projects, market range.'], weak: ['Accepting at once left money on the table (₹0.6–2.3 LPA below market).', 'Never accept on the spot — thank them and ask for time or flexibility.'] },
      s2: { strong: ['Proposed a package (₹7.6 + review) instead of a bare number — a strong trade.', 'Good use of a deadline (“this week”).'], average: ['An ultimatum without a real alternative offer damages goodwill.', 'Offer options: joining bonus, review date, learning budget.'], weak: ['Settled at the first counter without exploring other levers.', 'Ask about review cycle, bonus or certification sponsorship before accepting.'] },
      s3: { strong: ['Asked for the revised offer in writing and set a confirmation date.', 'Always confirm terms in writing.'], average: ['Fine, but you did not ask for the terms in writing.', 'Ask for the offer letter with all components listed.'], weak: ['Indecision after a fair offer can lose it.', 'If you need time, give a specific date.'] }
    }
  };

  /* ---------- follow-up templates ---------- */
  D.followUp = job => `Subject: Following up on my application — ${job.title}\n\nDear Hiring Team,\n\nI hope you are well. I applied for the ${job.title} position at ${job.company} on ${'{date}'} and wanted to follow up on the status of my application.\n\nI remain very interested in the role. My recent AWS and CI/CD projects — including a Jenkins pipeline that cut release time from 45 to 12 minutes — align closely with the responsibilities described. I would be glad to share any further details or take a technical discussion at your convenience.\n\nThank you for your time and consideration.\n\nWarm regards,\nAarav Sharma\n+91 98765 43210 | aarav.sharma@example.com`;
  D.coverLetter = (job, tone) => {
    const t = { professional: ['Dear Hiring Manager,', 'I am writing to apply for the ' + job.title + ' position at ' + job.company + '.', 'Sincerely,'], friendly: ['Hello Hiring Team,', 'I was really excited to see the ' + job.title + ' opening at ' + job.company + '.', 'Warm regards,'], concise: ['Dear Hiring Manager,', 'Please consider my application for ' + job.title + '.', 'Regards,'] }[tone || 'professional'];
    return `${t[0]}\n\n${t[1]} As a Computer Engineering graduate with hands-on cloud experience, I believe my skills in ${job.have.slice(0, 3).join(', ') || 'AWS, Linux and Docker'} match what you are looking for.\n\nDuring a three-month DevOps internship at Vertex Softworks, I automated the build and deployment of three microservices with Jenkins, reducing release time from 45 to 12 minutes, and deployed a containerised application on AWS EC2 behind a load balancer. I also built a Terraform-managed three-tier AWS VPC and hold the AWS Certified Cloud Practitioner certification.\n\n${job.gaps.length ? 'I am currently strengthening my ' + job.gaps.slice(0, 2).join(' and ') + ' skills through Radical Technologies’ DevOps programme, and I learn new tools quickly. ' : ''}${job.company} ${job.about.split(' ').slice(1, 12).join(' ')}… and I would welcome the chance to contribute to that work.\n\nThank you for your time and consideration. I would be delighted to discuss how I can add value to your team.\n\n${t[2]}\nAarav Sharma\n+91 98765 43210 | aarav.sharma@example.com`;
  };

  /* ---------- admin: students ---------- */
  const names = ['Rohit Patil', 'Sanjana Iyer', 'Mohit Deshmukh', 'Ananya Nair', 'Karan Mehta', 'Pooja Joshi', 'Vishal Kulkarni', 'Neha Reddy', 'Aditya Rao', 'Isha Kapoor', 'Sahil Khan', 'Divya Menon', 'Arjun Bhatt', 'Shreya Pillai', 'Rahul Verma', 'Tanvi Shah', 'Nikhil Jadhav', 'Kavya Gowda', 'Yash Chavan', 'Ritika Singh', 'Amit Pawar', 'Lakshmi Krishnan', 'Harsh Agarwal', 'Simran Kaur', 'Omkar Salunkhe', 'Fatima Sheikh', 'Varun Nambiar', 'Prachi Wagh'];
  const batches = ['AWS DevOps · Sept 2026', 'Azure Admin · Aug 2026', 'Python & Data · Sept 2026', 'Cyber Security · Aug 2026', 'Public sign-up'];
  const cities = ['Pune', 'Bengaluru', 'Kochi', 'Mumbai', 'Hyderabad', 'Nagpur'];
  D.users = [{ id: 'u_aarav', name: 'Aarav Sharma', email: 'aarav.sharma@example.com', city: 'Pune', batch: 'AWS DevOps · Sept 2026', type: 'radical', status: 'active', credits: 515, plan: 'basic', last: 0, mock: 74, apps: 8, av: 'aarav', joined: 23 }];
  names.forEach((n, i) => {
    const pub = i % 5 === 4 || i % 7 === 6;
    D.users.push({ id: 'u' + i, name: n, email: n.toLowerCase().replace(/[^a-z ]/g, '').replace(' ', '.') + '@example.com', city: cities[(i * 3) % 6], batch: pub ? 'Public sign-up' : batches[i % 4], type: pub ? 'public' : 'radical', status: i === 9 ? 'blocked' : i % 11 === 5 ? 'pending' : 'active', credits: [400, 320, 185, 60, 510, 240, 12, 90, 700, 150][i % 10], plan: i % 6 === 2 || i % 9 === 4 ? 'premium' : 'basic', last: (i * 2) % 9, mock: 38 + ((i * 17) % 55), apps: (i * 3) % 14, av: 'u' + i, joined: 5 + i * 2 });
  });

  D.costs = {
    days: Array.from({ length: 30 }, (_, i) => 12 + i),
    spend: [310, 280, 340, 420, 380, 260, 240, 410, 460, 520, 480, 390, 350, 470, 540, 590, 560, 430, 410, 610, 650, 690, 640, 520, 480, 700, 760, 810, 730, 640],
    byFeature: [{ n: 'Mock interviews', v: 6120, c: '#B3282D' }, { n: 'Resume & ATS', v: 2340, c: '#0B7E62' }, { n: 'Cover letters', v: 640, c: '#D68A0A' }, { n: 'Job matching', v: 720, c: '#3F5A86' }, { n: 'Follow-ups', v: 210, c: '#6B4FBB' }, { n: 'Course match', v: 160, c: '#6DB33F' }],
    byModel: [{ n: 'Self-hosted (embeddings, speech)', v: 0, c: '#6DB33F', f: '₹0 / server rent' }, { n: 'Economy (Gemini Flash-Lite)', v: 1050, c: '#3F5A86' }, { n: 'Standard (Gemini Flash)', v: 4120, c: '#D68A0A' }, { n: 'Premium (Claude Sonnet 5)', v: 4980, c: '#B3282D' }],
    cap: 15000
  };
  D.sources = [
    { n: 'Company career pages & ATS feeds', d: 'Greenhouse · Lever · Ashby · Workday · schema.org JobPosting', jobs: 3120, last: '2 h ago', st: 'ok' },
    { n: 'Licensed job-data API', d: 'Google-Jobs based feed with India coverage', jobs: 5480, last: '2 h ago', st: 'ok' },
    { n: 'Radical hiring partners', d: 'Jobs posted directly by Radical’s partner companies', jobs: 214, last: '35 min ago', st: 'ok' },
    { n: 'LinkedIn & Naukri deep links', d: 'Opens official search page — no scraping', jobs: 0, last: 'n/a', st: 'link' },
    { n: 'Indeed feed', d: 'Aggregated listings via API partner', jobs: 1930, last: '3 h ago', st: 'warn' }
  ];
  D.banks = [{ n: 'Aptitude questions', v: 1240, d: 'Quant · Logical · Verbal', r: 'Reviewed by 3 trainers' }, { n: 'Technical MCQs', v: 2860, d: 'AWS · DevOps · Linux · Python · Security · Data', r: 'Reviewed by 6 trainers' }, { n: 'Coding problems', v: 186, d: 'Easy 92 · Medium 68 · Hard 26', r: 'Tests verified' }, { n: 'HR scenarios', v: 92, d: 'Behavioural · Motivation · Logistics', r: 'Reviewed by HR' }, { n: 'GD topics', v: 64, d: 'Tech · Business · Society', r: 'Reviewed by placement team' }, { n: 'Negotiation scenarios', v: 18, d: 'Fresher · Lateral · Remote', r: 'Reviewed by HR' }];
  D.audit = [
    ['Sneha Kulkarni', 'Approved 400 credits for Ananya Nair', '2 min ago'], ['Sneha Kulkarni', 'Activated Premium plan for Neha Reddy (UPI ref 3390 5518 27)', '18 min ago'], ['System', 'Budget alert: monthly AI spend at 80% of cap', '1 h ago'],
    ['Sneha Kulkarni', 'Switched AI mode: Quality → Lean for Aptitude reports', '3 h ago'], ['Ravi Nair', 'Imported 48 students (AWS DevOps · Sept 2026)', 'Yesterday'], ['Sneha Kulkarni', 'Disabled Group Discussion module for batch “Public sign-up”', 'Yesterday'],
    ['System', 'Nightly backup completed (2.4 GB)', 'Yesterday'], ['Ravi Nair', 'Blocked company “Acme Staffing” (spam listings)', '2 days ago']
  ];
  D.sessions = [
    { s: 'Sanjana Iyer', r: 'Group discussion', sc: 81, d: '20 Sep, 11:42', t: '9 min', p: 'Premium', av: 'u1' }, { s: 'Aarav Sharma', r: 'Aptitude', sc: 73, d: '19 Sep, 18:10', t: '14 min', p: 'Basic', av: 'aarav' }, { s: 'Karan Mehta', r: 'Coding', sc: 64, d: '19 Sep, 16:25', t: '38 min', p: 'Premium', av: 'u4' },
    { s: 'Ananya Nair', r: 'HR round', sc: 77, d: '19 Sep, 14:03', t: '17 min', p: 'Basic', av: 'u3' }, { s: 'Rohit Patil', r: 'Technical test', sc: 58, d: '19 Sep, 10:31', t: '21 min', p: 'Basic', av: 'u0' }, { s: 'Divya Menon', r: 'Salary negotiation', sc: 69, d: '18 Sep, 19:44', t: '8 min', p: 'Premium', av: 'u11' },
    { s: 'Vishal Kulkarni', r: 'Group discussion', sc: 46, d: '18 Sep, 17:12', t: '8 min', p: 'Premium', av: 'u6' }, { s: 'Neha Reddy', r: 'HR round', sc: 83, d: '18 Sep, 12:50', t: '15 min', p: 'Basic', av: 'u7' }
  ];
  D.gaps = [['Kubernetes', 42], ['Communication', 38], ['System design basics', 31], ['Terraform', 29], ['Aptitude speed', 27], ['SQL', 22]];
  D.funnel = [['Registered', 1240], ['Onboarded (wishlist done)', 968], ['Resume built', 742], ['Applied to a job', 512], ['Practised interview', 388], ['Premium pass', 61], ['Course enquiry', 96]];
  D.leads = [
    { n: 'Sanjana Iyer', c: 'Interview & Career Skills Bootcamp', why: 'GD communication 58/100', t: 'Today, 11:58', st: 'New' }, { n: 'Karan Mehta', c: 'Data Structures & Algorithms with Python', why: 'Coding efficiency 52/100', t: 'Yesterday', st: 'Called' },
    { n: 'Riya Bose (public)', c: 'DevOps with Docker, Kubernetes & Terraform', why: 'Kubernetes gap in technical test', t: 'Yesterday', st: 'New' }, { n: 'Sahil Khan', c: 'Aptitude & Reasoning Crash Course', why: 'Aptitude 44/100', t: '2 days ago', st: 'Enrolled' }
  ];

  /* ---------- seeded state ---------- */
  const d = n => new Date(2026, 8, 20 - n, 10, 30).toISOString();
  D.seed = {
    _v: 4, session: null, jobFeed: { loaded: 0 }, plan: 'basic', premiumUntil: null, mode: 'quality', killSwitch: false, q: '',
    wallet: { free: 265, paid: 250 }, usage: { credits: 187 },
    ledger: [
      { id: 'l1', date: d(0), desc: 'Tailored resume — Cloud Engineer, Persistent', credits: -20, kind: 'spend', balance: 515 }, { id: 'l2', date: d(1), desc: 'Cover letter — DevOps Engineer, Thoughtworks', credits: -5, kind: 'spend', balance: 535 },
      { id: 'l3', date: d(2), desc: 'Admin grant — Boost pack (paid)', credits: 250, kind: 'grant', balance: 540 }, { id: 'l4', date: d(3), desc: 'ATS score check', credits: -5, kind: 'spend', balance: 290 }, { id: 'l5', date: d(4), desc: 'Job match run (top 10 explained)', credits: -5, kind: 'spend', balance: 295 },
      { id: 'l6', date: d(6), desc: 'Wishlist master resume', credits: -15, kind: 'spend', balance: 300 }, { id: 'l7', date: d(23), desc: 'Free Starter credits on sign-up', credits: 400, kind: 'grant', balance: 400 }
    ],
    requests: [
      { id: 'r1', student: 'Rohit Patil', av: 'u0', ask: 500, reason: 'Preparing for Persistent and TCS interviews — need more resume tailoring and mock rounds.', status: 'pending', date: d(0), type: 'credits' },
      { id: 'r2', student: 'Neha Reddy', av: 'u7', ask: 300, reason: 'Applied to 12 jobs this week and ran out of cover-letter credits.', status: 'pending', date: d(0), type: 'credits' },
      { id: 'r3', student: 'Mohit Deshmukh', av: 'u2', ask: 250, reason: 'Want to try the group discussion practice before campus drive.', status: 'pending', date: d(1), type: 'credits' },
      { id: 'r4', student: 'Ananya Nair', av: 'u3', ask: 400, reason: 'Job search push after course completion.', status: 'approved', granted: 400, date: d(3), type: 'credits' }
    ],
    planRequests: [
      { id: 'p1', student: 'Sanjana Iyer', av: 'u1', plan: 'premium', status: 'paid', quote: 599, ref: 'UPI 4821 7730 91', date: d(0), note: 'Paid via UPI, screenshot attached.' },
      { id: 'p2', student: 'Karan Mehta', av: 'u4', plan: 'premium', status: 'requested', quote: null, ref: '', date: d(0), note: '' }
    ],
    tracker: [
      { id: 't1', jobId: 'j3', status: 'interview', date: d(9), followUps: [{ day: 3, done: true }, { day: 7, done: true }, { day: 14, done: false }] },
      { id: 't2', jobId: 'j2', status: 'screening', date: d(6), followUps: [{ day: 3, done: true }, { day: 7, done: false }, { day: 14, done: false }] },
      { id: 't3', jobId: 'j6', status: 'applied', date: d(4), followUps: [{ day: 3, done: true }, { day: 7, done: false }, { day: 14, done: false }] },
      { id: 't4', jobId: 'j9', status: 'applied', date: d(3), followUps: [{ day: 3, done: true }, { day: 7, done: false }, { day: 14, done: false }] },
      { id: 't5', jobId: 'j12', status: 'rejected', date: d(12), followUps: [] },
      { id: 't6', jobId: 'j4', status: 'saved', date: d(1), followUps: [] },
      { id: 't7', jobId: 'j8', status: 'saved', date: d(1), followUps: [] },
      { id: 't8', jobId: 'j15', status: 'offer', date: d(15), followUps: [{ day: 3, done: true }, { day: 7, done: true }] }
    ],
    saved: ['j4', 'j8', 'j11'],
    resumes: [
      { id: 'rs0', title: 'Master resume (from wishlist)', job: null, ats: 84, date: d(6), master: true },
      { id: 'rs1', title: 'Cloud Engineer — Persistent Systems', job: 'j1', ats: 91, date: d(0) },
      { id: 'rs2', title: 'DevOps Engineer — Thoughtworks', job: 'j2', ats: 88, date: d(3) },
      { id: 'rs3', title: 'Cloud Support — AWS', job: 'j3', ats: 86, date: d(8) }
    ],
    covers: [{ id: 'cv1', job: 'j2', tone: 'professional', date: d(1) }],
    results: {
      aptitude: { score: 73, total: 15, correct: 11, time: '13:20', topics: { Quantitative: 67, Logical: 80, Verbal: 75 }, sample: false, date: d(1) },
      technical: { score: 78, total: 12, correct: 9, time: '17:04', topics: { AWS: 100, Linux: 75, Docker: 100, Git: 100, Kubernetes: 0, Terraform: 100, Networking: 100, Python: 100 }, short: 68, sample: false, date: d(1) }
    },
    attempts: {},
    notifications: [
      { id: 'n1', text: '<b>5 free job matches</b> are ready for you — open Job Matches to get them.', kind: 'info', t: '10 min ago', read: false },
      { id: 'n2', text: 'Reminder: follow up on <b>DevOps Engineer — Zensar</b> (day 7).', kind: 'warn', t: '2 h ago', read: false },
      { id: 'n3', text: 'Sneha (Radical admin) granted you <b>250 credits</b>.', kind: 'good', t: '2 days ago', read: true },
      { id: 'n4', text: '<b>3 new credit requests</b> and <b>2 plan requests</b> are waiting for approval.', kind: 'warn', t: '5 min ago', read: false, role: 'admin' },
      { id: 'n5', text: 'AI spend has reached <b>80%</b> of the monthly cap.', kind: 'warn', t: '1 h ago', read: false, role: 'admin' },
      { id: 'n6', text: 'Nightly job crawl finished: <b>+412 new jobs</b>, 96 expired.', kind: 'info', t: 'Today, 04:10', read: true, role: 'admin' }
    ],
    modules: { dashboard: true, jobs: true, resume: true, cover: true, tracker: true, interview: true, learn: true, credits: true, profile: true },
    userOverrides: {},
    consent: { data: true, marketing: false }
  };
})();
