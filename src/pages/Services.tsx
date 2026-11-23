import {useState} from "react";
import type {FormEvent} from "react";
import {useNavigate} from "react-router-dom";
import {MENU} from "../logic/Names";
import {useSiteLanguage} from "../i18n/SiteLanguage";
import {servicesTranslations} from "../i18n/servicesTranslations";
import "./Services.css";

const CONTACT_EMAIL = "andrea@manciotech.net";
const ENDPOINT = "https://formsubmit.co/ajax/" + CONTACT_EMAIL;
type DeliveryState = "idle" | "sending" | "submitted" | "error";

export default function Services() {
  const {language} = useSiteLanguage();
  const t = servicesTranslations[language];
  const navigate = useNavigate();
  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [company,setCompany] = useState("");
  const [topicIndex,setTopicIndex] = useState(0);
  const [problem,setProblem] = useState("");
  const [consent,setConsent] = useState(false);
  const [honeypot,setHoneypot] = useState("");
  const [status,setStatus] = useState<DeliveryState>("idle");
  const [validation,setValidation] = useState("");
  const [serviceError,setServiceError] = useState("");

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status==="sending") return;
    if (honeypot) return; // Spam trap: don't submit hidden-field entries.
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email.trim()) || problem.trim().length < 20 || !consent) {
      setValidation(t.invalid);
      return;
    }
    setValidation("");
    setServiceError("");
    setStatus("sending");
    try {
      const response=await fetch(ENDPOINT,{
        method:"POST",
        headers:{"Content-Type":"application/json","Accept":"application/json"},
        body:JSON.stringify({
          name:name.trim(),
          email:email.trim(),
          _replyto:email.trim(),
          company:company.trim(),
          topic:t.topics[topicIndex],
          message:problem.trim(),
          _subject:"MancioTech · richiesta servizi AI",
          _template:"table",
          _url:"https://manciotech.net/services",
          _honey:honeypot
        })
      });
      // A successful HTTP response alone doesn't guarantee service acceptance.
      const result: {success?: boolean | string; message?: string}=await response.json();
      if(!response.ok || !(result.success===true || result.success==="true")) {
        // FormSubmit can reply with HTTP 200 and success: "false". Preserve its error reason.
        throw new Error(typeof result.message==="string" && result.message.trim() ? result.message.trim() : "");
      }
      setStatus("submitted");
      setName("");setEmail("");setCompany("");setProblem("");setConsent(false);
    } catch (error) {
      setServiceError(error instanceof Error ? error.message.slice(0,300) : "");
      setStatus("error");
    }
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
        <form className="services-form" onSubmit={submit} noValidate>
          <div className="services-form-pair">
            <label>{t.name}<input name="name" autoComplete="name" required maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label>
            <label>{t.email}<input name="email" type="email" autoComplete="email" required maxLength={240} value={email} onChange={e=>setEmail(e.target.value)}/></label>
          </div>
          <label>{t.company}<input name="company" autoComplete="organization" maxLength={150} value={company} onChange={e=>setCompany(e.target.value)}/></label>
          <label>{t.topic}<select name="topic" value={topicIndex} onChange={e=>setTopicIndex(Number(e.target.value))}>
            {t.topics.map((item,i)=><option key={i} value={i}>{item}</option>)}
          </select></label>
          <label>{t.message}<textarea name="message" required minLength={20} maxLength={4000} rows={7} placeholder={t.messagePlaceholder} value={problem} onChange={e=>setProblem(e.target.value)}/></label>
          <div className="services-honeypot" aria-hidden="true"><label>Leave this empty<input tabIndex={-1} autoComplete="off" value={honeypot} onChange={e=>setHoneypot(e.target.value)}/></label></div>
          <label className="services-consent"><input type="checkbox" required checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>{t.consent}</span></label>
          {validation && <p role="alert" className="services-message services-error">{validation}</p>}
          {status==="submitted" && <p role="status" className="services-message services-success">{t.success}</p>}
          {status==="error" && <p role="alert" className="services-message services-error">{t.error}{serviceError && <span className="services-error-detail"> {t.serviceReason}: {serviceError}</span>}</p>}
          <button className="services-button services-submit" type="submit" disabled={status==="sending"}>{status==="sending"?t.sending:t.send} <span aria-hidden="true">↗</span></button>
        </form>
      </section>
    </main>
  );
}
