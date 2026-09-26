// Which /resources articles sit behind the healthcare-professional gate.
//
// The gate exists so the site can rely on the regulation 279 exemption in
// the Human Medicines Regulations 2012, which permits advertising of
// prescription-only medicines to people qualified to prescribe or supply
// them. It is not a general "this is for pharmacists" gate.
//
// Until 24 Sep 2026 the whole of /resources was gated. Anonymous visitors,
// Googlebot included, were redirected to /healthcare-professional, which
// carries robots noindex, nofollow. The effect was that none of the twelve
// guides were in Google's index at all: a site: search for
// getrealhealthpgd.co.uk/resources returned nothing.
//
// So the gate is now applied per article. An article is gated only when it
// names a prescription-only medicine or a POM treatment category. The
// remainder are business and governance guides written for pharmacy owners,
// which advertise this company's services rather than any medicine, and
// those are open and indexable.
//
// Keep this list in a module of its own: src/proxy.ts runs as Edge
// middleware and must not import src/data/articles.ts, which carries the
// full text of every article.
export const HCP_GATED_ARTICLE_SLUGS = new Set<string>([
  'most-profitable-pgds-for-pharmacy',          // Wegovy, Mounjaro, Shingrix, HRT, PrEP
  'how-to-start-a-travel-clinic-in-your-pharmacy', // doxycycline
  'hrt-through-pharmacy-what-is-possible-under-pgd', // HRT, oestrogen
  'glp1-weight-management-pharmacy-complete-guide',  // Wegovy, Mounjaro, semaglutide, tirzepatide
  'how-to-switch-pgd-providers',                // HRT
  'how-to-add-private-services-to-a-uk-community-pharmacy', // Wegovy, Mounjaro, Saxenda, orlistat, Mysimba, testosterone
])

export function isHcpGatedArticle(slug: string): boolean {
  return HCP_GATED_ARTICLE_SLUGS.has(slug)
}
