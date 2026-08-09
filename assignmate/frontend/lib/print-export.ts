export function exportResume(resume: any, user: any) {
  const name = resume.content?.personalDetails?.name || user?.name || "Candidate Name";
  const email = resume.content?.personalDetails?.email || user?.email || "candidate@example.com";
  const phone = resume.content?.personalDetails?.phone || "";
  const location = resume.content?.personalDetails?.location || "";
  const summary = resume.content?.personalDetails?.profileSummary || resume.content?.summary || "";
  const skills = resume.content?.skills || [];
  const experience = resume.content?.experience || [];
  const projects = resume.content?.projects || [];
  const education = resume.content?.education || [];
  const template = resume.template || "modern";

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to download the PDF");
    return;
  }

  let fontStack = "system-ui, -apple-system, sans-serif";
  let containerClass = "max-w-4xl mx-auto p-8 text-slate-800";
  let headerStyle = "border-b-2 border-slate-900 pb-4 mb-6";
  let sectionHeaderStyle = "text-lg font-bold tracking-wide uppercase text-slate-900 border-b border-slate-350 pb-1 mb-3";

  if (template === "professional") {
    fontStack = "Georgia, serif";
    headerStyle = "text-center border-b border-slate-900 pb-4 mb-6";
  } else if (template === "minimal") {
    fontStack = "'Courier New', monospace";
    headerStyle = "mb-8";
    sectionHeaderStyle = "text-md font-bold uppercase tracking-widest border-b border-slate-200 pb-1 mb-3";
  } else if (template === "ats-friendly") {
    fontStack = "Arial, sans-serif";
    headerStyle = "mb-4 border-b border-slate-400 pb-2";
  }

  const html = `
    <html>
      <head>
        <title>${resume.title}</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
          body {
            font-family: ${fontStack};
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @media print {
            body {
              padding: 0;
              margin: 0;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body class="bg-white">
        <div class="no-print bg-slate-900 text-white p-4 flex justify-between items-center mb-6">
          <p class="text-sm font-semibold">Print Preview - Choose 'Save as PDF' in the destination options.</p>
          <button onclick="window.print(); window.close();" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-bold transition-all shadow-md">
            Save/Print PDF
          </button>
        </div>

        <div class="${containerClass}">
          <!-- Header -->
          <div class="${headerStyle}">
            <h1 class="text-3xl font-extrabold uppercase text-slate-950">${name}</h1>
            <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 mt-2 ${template === 'professional' ? 'justify-center' : ''}">
              ${email ? `<span>Email: ${email}</span>` : ""}
              ${phone ? `<span>| Phone: ${phone}</span>` : ""}
              ${location ? `<span>| Location: ${location}</span>` : ""}
            </div>
          </div>

          <!-- Summary -->
          ${summary ? `
          <div class="mb-6">
            <h2 class="${sectionHeaderStyle}">Professional Summary</h2>
            <p class="text-sm leading-relaxed text-slate-700">${summary}</p>
          </div>
          ` : ""}

          <!-- Experience -->
          ${experience.length > 0 ? `
          <div class="mb-6">
            <h2 class="${sectionHeaderStyle}">Experience</h2>
            <div class="space-y-4">
              ${experience.map((exp: any) => `
                <div>
                  <div class="flex justify-between items-start">
                    <h3 class="font-bold text-slate-900 text-sm">${exp.role || exp.position || "Role"}</h3>
                    <span class="text-xs text-slate-500 font-medium">${exp.duration || `${exp.startDate ? new Date(exp.startDate).getFullYear() : ""} - ${exp.endDate ? new Date(exp.endDate).getFullYear() : "Present"}`}</span>
                  </div>
                  <p class="text-xs font-semibold text-slate-700">${exp.company || "Company"}</p>
                  <p class="text-xs text-slate-600 mt-1 whitespace-pre-line leading-relaxed">${exp.description || ""}</p>
                </div>
              `).join("")}
            </div>
          </div>
          ` : ""}

          <!-- Projects -->
          ${projects.length > 0 ? `
          <div class="mb-6">
            <h2 class="${sectionHeaderStyle}">Projects</h2>
            <div class="space-y-4">
              ${projects.map((proj: any) => `
                <div>
                  <h3 class="font-bold text-slate-900 text-sm">${proj.title}</h3>
                  ${proj.technologies ? `<p class="text-[11px] font-bold text-blue-600 uppercase tracking-wider mt-0.5">${proj.technologies.join(", ")}</p>` : ""}
                  <p class="text-xs text-slate-600 mt-1 leading-relaxed">${proj.description}</p>
                </div>
              `).join("")}
            </div>
          </div>
          ` : ""}

          <!-- Skills -->
          ${skills.length > 0 ? `
          <div class="mb-6">
            <h2 class="${sectionHeaderStyle}">Skills</h2>
            <div class="flex flex-wrap gap-2">
              ${skills.map((skill: string) => `
                <span class="bg-slate-100 border border-slate-200 text-slate-800 text-xs px-2.5 py-1 rounded font-medium">${skill}</span>
              `).join("")}
            </div>
          </div>
          ` : ""}

          <!-- Education -->
          ${education.length > 0 || user?.college ? `
          <div class="mb-6">
            <h2 class="${sectionHeaderStyle}">Education</h2>
            <div class="space-y-2">
              ${education.length > 0 ? education.map((edu: any) => `
                <div>
                  <div class="flex justify-between items-start">
                    <h3 class="font-bold text-slate-900 text-sm">${edu.degree || "Degree"} in ${edu.field || "Field"}</h3>
                    <span class="text-xs text-slate-500">${edu.startDate ? new Date(edu.startDate).getFullYear() : ""} - ${edu.endDate ? new Date(edu.endDate).getFullYear() : ""}</span>
                  </div>
                  <p class="text-xs text-slate-600">${edu.school || "School"}</p>
                </div>
              `).join("") : `
                <div>
                  <h3 class="font-bold text-slate-900 text-sm">${user?.branch || "Computer Science"}</h3>
                  <p class="text-xs text-slate-600">${user?.college || "State University"}</p>
                  ${user?.semester ? `<p class="text-[11px] text-slate-500 font-medium">Semester ${user.semester}</p>` : ""}
                </div>
              `}
            </div>
          </div>
          ` : ""}
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

export function exportPresentation(presentation: any) {
  const title = presentation.title || "Presentation";
  const subject = presentation.subject || "";
  const slides = presentation.slides || [];
  const template = presentation.template || "academic";

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to export the presentation");
    return;
  }

  let bgClass = "bg-white text-slate-900";
  let cardClass = "border border-slate-200 shadow-sm";
  let titleColor = "text-indigo-900";
  let bulletColor = "text-indigo-600";

  if (template === "modern") {
    bgClass = "bg-slate-950 text-white";
    cardClass = "border border-slate-800 bg-slate-900";
    titleColor = "text-purple-400";
    bulletColor = "text-purple-500";
  } else if (template === "minimal") {
    bgClass = "bg-slate-50 text-slate-900";
    cardClass = "border border-slate-100 bg-white";
    titleColor = "text-slate-900";
    bulletColor = "text-slate-400";
  } else if (template === "business") {
    bgClass = "bg-slate-50 text-slate-900";
    cardClass = "border-t-4 border-t-blue-700 border border-slate-200 bg-white";
    titleColor = "text-blue-900";
    bulletColor = "text-blue-700";
  }

  const html = `
    <html>
      <head>
        <title>${title}</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .slide-page {
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            page-break-after: always;
            padding: 2rem;
            box-sizing: border-box;
          }
          .slide-box {
            width: 90%;
            height: 85%;
            padding: 3rem;
            display: flex;
            flex-direction: column;
            border-radius: 0.5rem;
          }
          @media print {
            .no-print {
              display: none;
            }
            .slide-page {
              padding: 0;
              margin: 0;
            }
            .slide-box {
              width: 100%;
              height: 100%;
              border-radius: 0;
              box-shadow: none !important;
              border: none !important;
            }
          }
        </style>
      </head>
      <body class="${bgClass} m-0 p-0 overflow-x-hidden">
        <div class="no-print bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0">
          <div>
            <h1 class="text-sm font-bold">${title}</h1>
            <p class="text-xs text-slate-400">Print Preview - Choose Landscape layout and "Save as PDF".</p>
          </div>
          <button onclick="window.print(); window.close();" class="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded text-sm font-bold transition-all shadow-md">
            Save/Print Slides PDF
          </button>
        </div>

        <div class="slide-page">
          <div class="slide-box ${cardClass} flex flex-col justify-center items-center text-center">
            <span class="text-xs font-bold tracking-widest uppercase text-slate-500 mb-2">${subject || "Presentation"}</span>
            <h1 class="text-4xl md:text-5xl font-extrabold ${titleColor} max-w-3xl">${title}</h1>
            <div class="w-20 h-1 bg-indigo-500 my-6"></div>
            <p class="text-sm text-slate-500 font-medium">Generated with AssignMate AI</p>
          </div>
        </div>

        ${slides.map((slide: any) => `
          <div class="slide-page">
            <div class="slide-box ${cardClass} justify-between">
              <div>
                <div class="flex justify-between items-center mb-6">
                  <h2 class="text-2xl font-bold ${titleColor}">${slide.title || `Slide ${slide.slideNumber}`}</h2>
                  <span class="text-xs font-bold text-slate-400">Slide ${slide.slideNumber || ""}</span>
                </div>
                
                <ul class="space-y-4 text-base leading-relaxed">
                  ${(slide.content || []).map((point: string) => `
                    <li class="flex items-start">
                      <span class="mr-3 ${bulletColor} text-lg">•</span>
                      <span>${point}</span>
                    </li>
                  `).join("")}
                </ul>
              </div>

              ${slide.notes ? `
                <div class="mt-8 pt-4 border-t border-dashed border-slate-300 no-print">
                  <h4 class="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Speaker Notes</h4>
                  <p class="text-xs text-slate-500 leading-relaxed">${slide.notes}</p>
                </div>
              ` : ""}
            </div>
          </div>
        `).join("")}
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
