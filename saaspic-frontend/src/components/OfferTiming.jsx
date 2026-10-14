"use client";
import { useEffect, useState } from "react";
import { getOfferStatus, remainingTime } from "@/lib/dealDates";
import AffiliateButton from "./AffiliateButton";
import "./offer-dates.css";

function useOfferClock(deal, initialNow) {
  const [now, setNow] = useState(initialNow);
  useEffect(() => {
    const timer = setTimeout(() => setNow(Date.now()), 0);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    const future = [deal.startDate, deal.endDate].filter(Boolean).map(value => new Date(value).getTime()).filter(time => time > now);
    if (!future.length || deal.isActive === false) return;
    const delay = Math.max(1, Math.min(30000, ...future.map(time => time - now)));
    const timer = setTimeout(() => setNow(Date.now()), delay);
    return () => clearTimeout(timer);
  }, [deal.startDate, deal.endDate, deal.isActive, now]);
  return [now, setNow];
}
function OfferDate({ value }) {
  return <time dateTime={value}>{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(value))} UTC</time>;
}
export default function OfferTiming({ deal, initialNow }) {
  const [now] = useOfferClock(deal, initialNow);
  const status = getOfferStatus(deal, now);
  return <div className="offer-timing">
    <span className={`offer-status offer-status-${status.toLowerCase()}`}>{status}</span>
    {deal.startDate && <small>Starts: <OfferDate value={deal.startDate} /></small>}
    {deal.endDate && <small>Ends: <OfferDate value={deal.endDate} /></small>}
    {status === "Upcoming" && <small>Starts in {remainingTime(deal.startDate, now)}</small>}
    {status === "Active" && deal.endDate && <small>{remainingTime(deal.endDate, now)} remaining</small>}
    {status === "Active" && !deal.endDate && deal.startDate && <small>No expiry date</small>}
  </div>;
}
export function DealOfferButton({ deal, initialNow, ...props }) {
  const [now, setNow] = useOfferClock(deal, initialNow);
  if (getOfferStatus(deal, now) !== "Active") return <p className="offer-unavailable">{getOfferStatus(deal, now) === "Upcoming" ? "This offer has not started yet." : "This offer is no longer active."}</p>;
  return <div onClickCapture={event => {
    const current = Date.now();
    if (getOfferStatus(deal, current) !== "Active") { event.preventDefault(); event.stopPropagation(); setNow(current); }
  }}><AffiliateButton {...props} /></div>;
}
