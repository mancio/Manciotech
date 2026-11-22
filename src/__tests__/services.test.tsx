import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import Menu from "../pages/Menu";
import Services from "../pages/Services";
import {SiteLanguageProvider,SiteLanguageSwitcher} from "../i18n/SiteLanguage";

beforeEach(()=>{
  localStorage.clear();
  jest.restoreAllMocks();
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

test("contact form requires consent and submits the description to the email service",async()=>{
  const mock=jest.spyOn(global,"fetch").mockResolvedValue({
    ok:true,
    json:async()=>({success:"true"})
  } as Response);
  renderServices("/services");
  fireEvent.change(screen.getByLabelText("Your name"),{target:{value:"Test Person"}});
  fireEvent.change(screen.getByLabelText("Your email"),{target:{value:"contact@example.org"}});
  fireEvent.change(screen.getByLabelText("Describe the problem"),{target:{value:"I need help improving repetitive reporting workflows."}});
  fireEvent.click(screen.getByRole("button",{name:/Send request/}));
  expect(screen.getByRole("alert")).toHaveTextContent(/Please provide/);
  expect(mock).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button",{name:/Send request/}));
  await waitFor(()=>expect(mock).toHaveBeenCalledTimes(1));
  const [url,options]=mock.mock.calls[0];
  expect(url).toBe("https://formsubmit.co/ajax/andrea@manciotech.net");
  const body=JSON.parse(String((options as RequestInit).body));
  expect(body.email).toBe("contact@example.org");
  expect(body.message).toMatch(/repetitive reporting/);
  expect(body._subject).toMatch(/MancioTech/);
  expect(await screen.findByRole("status")).toHaveTextContent(/submitted/);
});

test("contact form reports remote submission failures instead of claiming delivery",async()=>{
  jest.spyOn(global,"fetch").mockResolvedValue({ok:false,json:async()=>({success:false})} as Response);
  renderServices("/services");
  fireEvent.change(screen.getByLabelText("Your name"),{target:{value:"Test Person"}});
  fireEvent.change(screen.getByLabelText("Your email"),{target:{value:"contact@example.org"}});
  fireEvent.change(screen.getByLabelText("Describe the problem"),{target:{value:"This reporting workflow needs a reliable automation."}});
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button",{name:/Send request/}));
  expect(await screen.findByRole("alert")).toHaveTextContent(/could not be submitted/);
});
