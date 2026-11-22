import {useEffect, useRef, useState} from "react";
import type {FormEvent} from "react";
import {useNavigate} from "react-router-dom";
import {MENU} from "../logic/Names";
import {useSiteLanguage} from "../i18n/SiteLanguage";
import {servicesTranslations} from "../i18n/servicesTranslations";
import "./Services.css";

const CONTACT_EMAIL = "andrea@manciotech.net";
// Set this only after publishing the Google Apps Script as a web app.
function scriptEndpoint(){return (process.env.REACT_APP_GOOGLE_APPS_SCRIPT_URL || "").trim();}
function validScriptEndpoint(url:string){return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url);}
const FRAME_NAME = "manciotech-contact-response";
type DeliveryState = "idle" | "sending" | "submitted" | "error";

export default function Services() {
  const {language} = useSiteLanguage();
  const t = servicesTranslations[language];
  const endpoint=scriptEndpoint();
  const endpointReady=validScriptEndpoint(endpoint);
  const navigate = useNavigate();
  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [company,setCompany] = useState("");
  const [topicIndex,setTopicIndex] = useState(0);
  const [problem,setProblem] = useState("");
  const [consent,setConsent] = useState(false);
  const [honeypot,setHoneypot] = useState("");
  const [requestId,setRequestId] = useState("");
  const formRef=useRef<HTMLFormElement>(null);
  const timeoutRef=useRef<number | null>(null);
  const [status,setStatus] = useState<DeliveryState>("idle");
  const [validation,setValidation] = useState("");
  const [serviceError,setServiceError] = useState("");

  useEffect(()=>{
    function receive(event:MessageEvent) {
      // The HTML-service response can be served from a Google iframe origin.
      let host="";
      try { host=new URL(event.origin).hostname; } catch { return; }
      if (!(host==="script.google.com" || host==="script.googleusercontent.com" || host.endsWith(".script.googleusercontent.com") || host.endsWith("-script.googleusercontent.com"))) return;
      const data=event.data;
      if (!data || data.source!=="manciotech-apps-script" || data.requestId!==requestId || !requestId) return;
      if(timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current=null;
      if(data.success===true){
        setStatus("submitted");
        setName("");setEmail("");setCompany("");setProblem("");setConsent(false);
      }else{
        setServiceError(typeof data.message==="string" ? data.message.slice(0,240) : "");
        setStatus("error");
      }
    }
    window.addEventListener("message",receive);
    return ()=>{window.removeEventListener("message",receive);if(timeoutRef.current)clearTimeout(timeoutRef.current);};
  },[requestId]);

  function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status==="sending") return;
    if (honeypot) return;
    if (!endpointReady) {
      setStatus("error");
      setServiceError(t.unavailable);
      return;
    }
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email.trim()) || problem.trim().length<20 || !consent) {
      setValidation(t.invalid);
      return;
    }
    setValidation("");
    setServiceError("");
    setStatus("sending");
    const id=Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,15);
    setRequestId(id);
    // React commits the hidden request ID before the form is submitted.
    window.setTimeout(()=>{
      if(!formRef.current)return;
      formRef.current.submit(); // Native POST avoids cross-origin fetch/CORS.
      if(timeoutRef.current)clearTimeout(timeoutRef.current);
      timeoutRef.current=window.setTimeout(()=>{
        setStatus("error");
        setServiceError(t.timeout);
      },20000);
    },0);
  }

  return (
    <main className="services-page" lang={language.toLowerCase()}>
      <header className="services-hero">
        <button className="services-back" type="button" onClick={()=>navigate(MENU)}>← {t.back}</button>
        <p className="services-eyebrow">✦ {t.eyebrow} ✦</p>
        <h1>{t.title}</h1>
        <p>{t.intro}</p>
        <a className="services-button" href="#contact">{t.formTitle} <span aria-hidden="true">↗</span></a>
      </header>

      <section className="services-offerings" aria-label={t.eyebrow}>
        <article className="services-offer">
          <span className="services-offer-icon" aria-hidden="true">⌘</span>
          <h2>{t.buildTitle}</h2><p>{t.buildText}</p><div className="services-example">{t.buildExample}</div>
        </article>
        <article className="services-offer">
          <span className="services-offer-icon" aria-hidden="true">✦</span>
          <h2>{t.advisoryTitle}</h2><p>{t.advisoryText}</p><div className="services-example">{t.advisoryExample}</div>
        </article>
        <article className="services-offer">
          <span className="services-offer-icon" aria-hidden="true">⚡</span>
          <h2>{t.productivityTitle}</h2><p>{t.productivityText}</p><div className="services-example">{t.productivityExample}</div>
        </article>
      </section>

      <section className="services-wiki" aria-labelledby="services-wiki-title">
        <div className="services-section-head"><span aria-hidden="true">📚</span><h2 id="services-wiki-title">{t.wikiTitle}</h2></div>
        <p className="services-lead">{t.wikiIntro}</p>
        <div className="services-step-grid">
          {t.wikiSteps.map(([title,description])=><div className="services-step" key={title}><h3>{title}</h3><p>{description}</p></div>)}
        </div>
        <div className="services-case"><h3>{t.wikiExampleTitle}</h3><p>{t.wikiExample}</p></div>
      </section>

      <section className="services-approach">
        <h2>{t.approachTitle}</h2>
        <div className="services-step-grid">
          {t.approachSteps.map(([title,description],i)=><div className="services-step" key={title}><div className="services-step-number">{String(i+1).padStart(2,"0")}</div><h3>{title}</h3><p>{description}</p></div>)}
        </div>
      </section>

      <section className="services-contact" id="contact" aria-labelledby="services-contact-title">
        <div className="services-contact-intro">
          <p className="services-eyebrow">✉ {CONTACT_EMAIL}</p>
          <h2 id="services-contact-title">{t.formTitle}</h2>
          <p>{t.formIntro}</p>
          <p className="services-warning">{t.privacyNote}</p>
          <p className="services-small">{t.service}</p>
          <p className="services-small">{t.activation}</p>
        </div>
        <iframe name={FRAME_NAME} title="Google Apps Script contact response" className="services-response-frame" tabIndex={-1} aria-hidden="true"/>
        <form ref={formRef} className="services-form" action={endpointReady?endpoint:undefined} target={FRAME_NAME} method="POST" onSubmit={submit} noValidate>
          <input type="hidden" name="requestId" value={requestId}/>
          <input type="hidden" name="source" value="manciotech.net"/>
          <input type="hidden" name="subject" value="MancioTech · richiesta servizi AI"/>
          <div className="services-form-pair">
            <label>{t.name}<input name="name" autoComplete="name" required maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label>
            <label>{t.email}<input name="email" type="email" autoComplete="email" required maxLength={240} value={email} onChange={e=>setEmail(e.target.value)}/></label>
          </div>
          <label>{t.company}<input name="company" autoComplete="organization" maxLength={150} value={company} onChange={e=>setCompany(e.target.value)}/></label>
          <label>{t.topic}<select name="topic" value={t.topics[topicIndex]} onChange={e=>setTopicIndex(t.topics.findIndex(item=>item===e.target.value))}>
            {t.topics.map((item,i)=><option key={i} value={item}>{item}</option>)}
          </select></label>
          <label>{t.message}<textarea name="message" required minLength={20} maxLength={4000} rows={7} placeholder={t.messagePlaceholder} value={problem} onChange={e=>setProblem(e.target.value)}/></label>
          <div className="services-honeypot" aria-hidden="true"><label>Leave this empty<input name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={e=>setHoneypot(e.target.value)}/></label></div>
          <label className="services-consent"><input type="checkbox" name="consent" value="yes" required checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>{t.consent}</span></label>
          {!endpointReady && <p className="services-message services-error" role="status">{t.unavailable}</p>}
          {validation && <p role="alert" className="services-message services-error">{validation}</p>}
          {status==="submitted" && <p role="status" className="services-message services-success">{t.success}</p>}
          {status==="error" && <p role="alert" className="services-message services-error">{t.error}{serviceError && <span className="services-error-detail"> {t.serviceReason}: {serviceError}</span>}</p>}
          <button className="services-button services-submit" type="submit" disabled={status==="sending" || !endpointReady}>{status==="sending"?t.sending:t.send} <span aria-hidden="true">↗</span></button>
        </form>
      </section>
    </main>
  );
}
