import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import Menu from "../pages/Menu";
import Services from "../pages/Services";
import {SiteLanguageProvider,SiteLanguageSwitcher} from "../i18n/SiteLanguage";

beforeEach(()=>{
  localStorage.clear();
  jest.restoreAllMocks();
  delete process.env.REACT_APP_GOOGLE_APPS_SCRIPT_URL;
});

function renderServices(start="/") {
  return render(
    <MemoryRouter initialEntries={[start]}>
      <SiteLanguageProvider>
        <SiteLanguageSwitcher/>
        <Routes>
          <Route path="/" element={<Menu/>}/>
          <Route path="/services" element={<Services/>}/>
        </Routes>
      </SiteLanguageProvider>
    </MemoryRouter>
  );
}

test("services preview appears after Try my tools and navigates to the detailed page",()=>{
  renderServices();
  const tools=screen.getByRole("heading",{name:"Try my tools"});
  const services=screen.getByRole("heading",{name:"Build smarter. Work better."});
  expect(tools.compareDocumentPosition(services) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  fireEvent.click(screen.getByRole("button",{name:/Explore my AI services/}));
  expect(screen.getByRole("heading",{name:"AI that solves real problems."})).toBeInTheDocument();
  expect(screen.getByRole("heading",{name:"Wiki-LLM: a living knowledge base"})).toBeInTheDocument();
  expect(screen.getByRole("heading",{name:"Tell me what is slowing you down"})).toBeInTheDocument();
});

test("services page follows the global Italian and Polish language flags",()=>{
  renderServices("/services");
  fireEvent.click(screen.getByRole("button",{name:"Italiano"}));
  expect(screen.getByRole("heading",{name:"AI che risolve problemi concreti."})).toBeInTheDocument();
  expect(screen.getByLabelText("Descrivi la problematica")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Polski"}));
  expect(screen.getByRole("heading",{name:"AI rozwiązujące realne problemy."})).toBeInTheDocument();
  expect(screen.getByLabelText("Opisz problem")).toBeInTheDocument();
});

const SCRIPT_URL="https://script.google.com/macros/s/AKfycb-test123/exec";
function fillContact(){
  fireEvent.change(screen.getByLabelText("Your name"),{target:{value:"Test Person"}});
  fireEvent.change(screen.getByLabelText("Your email"),{target:{value:"contact@example.org"}});
  fireEvent.change(screen.getByLabelText("Describe the problem"),{target:{value:"I need help improving repetitive reporting workflows."}});
}
function simulateScriptResponse(success:boolean, message=""){
  const id=(document.querySelector('input[name="requestId"]') as HTMLInputElement).value;
  expect(id).not.toBe("");
  window.dispatchEvent(new MessageEvent("message",{
    origin:"https://script.googleusercontent.com",
    data:{source:"manciotech-apps-script",requestId:id,success,message}
  }));
}

test("contact form is safely disabled until a Google Apps Script endpoint is configured",()=>{
  delete process.env.REACT_APP_GOOGLE_APPS_SCRIPT_URL;
  renderServices("/services");
  expect(screen.getByRole("button",{name:/Send request/})).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent(/being configured/);
  expect(screen.queryByText(/FormSubmit/i)).not.toBeInTheDocument();
  expect(screen.queryByRole("link",{name:"andrea@manciotech.net"})).not.toBeInTheDocument();
});

test("contact form validates consent and submits to Google Apps Script without fetch",async()=>{
  process.env.REACT_APP_GOOGLE_APPS_SCRIPT_URL=SCRIPT_URL;
  const submit=jest.spyOn(HTMLFormElement.prototype,"submit").mockImplementation(()=>{});
  renderServices("/services");
  fillContact();
  fireEvent.click(screen.getByRole("button",{name:/Send request/}));
  expect(screen.getByRole("alert")).toHaveTextContent(/Please provide/);
  expect(submit).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button",{name:/Send request/}));
  await waitFor(()=>expect(submit).toHaveBeenCalledTimes(1));
  const form=screen.getByRole("button",{name:/Sending/}).closest("form") as HTMLFormElement;
  expect(form.action).toBe(SCRIPT_URL);
  expect(form.method.toLowerCase()).toBe("post");
  expect(form.target).toBe("manciotech-contact-response");
  expect((form.querySelector('input[name="email"]') as HTMLInputElement).value).toBe("contact@example.org");
  expect((form.querySelector('textarea[name="message"]') as HTMLTextAreaElement).value).toMatch(/repetitive reporting/);
  simulateScriptResponse(true);
  expect(await screen.findByRole("status")).toHaveTextContent(/notification email was sent/);
});

test("contact form reports errors from the authorized Google iframe",async()=>{
  process.env.REACT_APP_GOOGLE_APPS_SCRIPT_URL=SCRIPT_URL;
  jest.spyOn(HTMLFormElement.prototype,"submit").mockImplementation(()=>{});
  renderServices("/services");
  fillContact();
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button",{name:/Send request/}));
  await waitFor(()=>expect(screen.getByRole("button",{name:/Sending/})).toBeInTheDocument());
  simulateScriptResponse(false,"Email quota exceeded");
  expect(await screen.findByRole("alert")).toHaveTextContent(/Email quota exceeded/);
  expect(screen.queryByText(/notification email was sent/)).not.toBeInTheDocument();
});
