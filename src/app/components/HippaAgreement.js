import React from 'react';
import classnames from 'classnames';

export default class HippaAgreement extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			...props
		};
	}

	render() {
		return (
			<div className="tos">
				<p>This HIPAA Business Associate Addendum (“<b>Addendum</b>”) is incorporated by reference into the <b>IMYOURDOC.COM Terms of use Agreement</b> (“<b>Agreement</b>”) between the physician, doctor, nurse or other medical professional who is a Registered User (“<b>Covered Entity</b>”), and <b>IMYOURDOC.COM, Inc.</b>, the Business Associate (“<b>Business Associate</b>”), and is effective on the effective date of the Agreement. In the event of any conflict between this Addendum and the Agreement, the terms of this Addendum will supersede to the extent of any actual conflict. Capitalized terms used herein, but undefined will have the meaning given to such term in the Agreement. BY CLICKING THE “I AGREE” BUTTON OR BY ACCESSING, VISITING, BROWSING, USING OR ATTEMPTING TO INTERACT WITH ANY PART OF THE WEBSITE, OR THE APP, YOU AGREE THAT YOU HAVE READ, UNDERSTAND AND AGREE TO BE BOUND BY THIS AGREEMENT. IN THE EVENT YOUR ACCESS TO THE SERVICES HAS BEEN PROCURED OR ENABLED BY YOUR PRINCIPAL, REPRESENTATIVE AND/OR OTHER ADMINISTRATOR(S) (EACH, AN “<b>ADMINISTRATOR</b>”), AND SUCH ADMINISTRATOR HAS ENTERED INTO A WRITTEN AND PEN-SIGNED LICENSE AGREEMENT REGARDING THE SUBJECT MATTER HEREOF (AN “<b>ENTERPRISE AGREEMENT</b>”), THAT ENTERPRISE AGREEMENT WILL SUPERSEDE THIS AGREEMENT TO THE EXTENT OF ANY DIRECT CONFLICT. IF YOU DO NOT AGREE TO BE BOUND BY THIS AGREEMENT, DO NOT ACCESS OR USE THE WEBSITE, APP OR SERVICES. </p>
				<p>Recitals</p>
				<p>A. Covered Entity wishes to disclose certain information (“Information”) to Business Associate pursuant to the terms of the Agreement, some of which may constitute Protected Health Information (“<b>PHI</b>”).</p>
				<p>B. Covered Entity and Business Associate intend to protect the privacy and provide for the security of PHI disclosed to Associate pursuant to the Agreement in compliance with the Health Insurance Portability and Accountability Act of 1996, Public Law 104-191 (“HIPAA”) and regulations promulgated thereunder by the U.S. Department of Health and Human Services (the “<b>HIPAA Regulations</b>”) and other applicable laws.</p>
				<p>C. The purpose of this Addendum is to satisfy certain standards and requirements of HIPAA and the HIPAA Regulations, including, but not limited to, Title 45, Section 164.504(e) of the Code of Federal Regulations (“<b>CFR</b>”), as the same may be amended from time to time.</p>
				<p>In consideration of the mutual promises below and the exchange of information pursuant to this Addendum, the parties agree as follows:</p>
				<p><b>1. Definitions.</b></p>
				<p><b>“Business Associate</b>” shall have the meaning given to such term under the HIPAA </p>
				<p>Regulations, including, but not limited to, 45 CFR Section 160.103, and in this Agreement refers to IMYOURDOC.COM, Inc., liability Delaware Incorporated company.</p>
				<p><b>“Covered Entity</b>” shall have the meaning given to such term under HIPAA and the HIPAA Regulations, including, but not limited to, 45 CFR Section 160.103, and in this Agreement refers to the Physician.</p>
				<p><b>“Privacy Rule”</b> shall mean the Standards of Privacy of Individually Identifiable Health Information, 45 CFR Part 160 and part 164, Subparts A and E.</p>
				<p><b>“Protected Health Information” or “PHI”</b> means any information, whether oral or recorded in any form or medium that is created, received, maintained, or transmitted by Business Associate for or on behalf of Covered Entity: (i) that relates to the past, present or future physical or mental condition of an individual; the provision of health care to an individual; or the past, present or future payment for the provision of health care to an individual, and (ii) that identifies the individual or with respect to which there is a reasonable basis to believe the information can be used to identify the individual, and shall have the meaning given to such term under HIPAA and the HIPAA Regulations, including, but not limited to 45 CFR Section 164.501. <i>[45 CFR § 160.103; 45 CFR § 501]</i></p>
				<p><b>“Secretary”</b> shall mean the Secretary of the Department of Health and Human Services or his designee.</p>
				<p><b>2. Business Associate Use and Disclosure of PHI</b></p>
				<p><b>Uses and Disclosures.</b> Except as provided otherwise in this Agreement, Business Associate may use or disclose PHI on behalf of, or to provide services to, Covered Entity for the purposes described herein, if such use or disclosure of PHI would not violate the Privacy Rule if done by Covered Entity or the minimum necessary policies and procedures of the Covered Entity. </p>
				<p><b>Purpose.</b> Business Associate has a contract with the Covered Entity to provide communication services between the Covered Entity (Physician) and his or her patients. Satisfactory completion of these services by Business Associate will require Business Associate to receive PHI obtained from Covered Entity, including medical, demographic, and medical records information regarding Covered Entity’s patients. This information will be accessible to Business Associate employees in the normal course of their duties. The purpose of this Addendum is to protect such PHI from prohibited disclosures. Business Associate may use PHI for the proper management and administration of the Business Associate’s business, or to carry out the legal responsibilities of Business Associate. Business Associate shall obtain reasonable assurances from any person to whom PHI is disclosed that the PHI will remain confidential and that that person will notify Business Associate of any instances of which it becomes aware in which the confidentiality of the information has been breached.</p>
				<p>3. <b>Business Associate Obligations</b></p>
				<p><b>Limitations on Use of PHI. </b>Business Associate and all of its officers, directors, managers, employees, and agents shall not use PHI except as permitted or required by this Addendum or as required by law. Business Associate may de-identify any and all PHI created or received by Business Associate under this Addendum. Once PHI has been de-identified pursuant to 45 CFR 164.514(b), such information is no longer PHI and no longer subject to this Addendum.</p>
				<p><b>Limitations on Disclosure of PHI. </b>Business Associate shall not disclose PHI except as permitted or required by this Addendum or as required by law. Business Associate may disclose PHI (i) for Business Associate’s proper management and administration, and (ii) to carry out the legal responsibilities of Business Associate under this Addendum, assuming either of the following conditions are satisfied: (a) the disclosure is required by law; or (b) Business Associate obtains reasonable assurances from the person to whom Business Associate further discloses the PHI that the information will be held confidentially, that the information will be used or further disclosed only as required by law or for the purposes for which it was disclosed, and the person notifies Business Associate of any instances where the confidentiality of the information has been breached.</p>
				<p><b>Authorizations.</b> Notwithstanding any other limitation in this Addendum, Covered Entity agrees that nothing in this Addendum prohibits Business Associate from using or disclosing the PHI to the extent permitted by an authorization from the applicable patient.</p>
				<p><b>Safeguarding PHI.</b> Business Associate shall use appropriate safeguards to prevent the use or disclosure of PHI other than as permitted by this Addendum. Business Associate shall use appropriate safeguards to prevent unauthorized parties from accessing, using, disclosing, or tampering with PHI transmitted to or from Covered Entity. </p>
				<p><b>Third Party Agreements.</b> Under certain circumstances, Business Associate may need to enter into agreements with third parties, including subcontractors, in order to satisfy its obligations to provide services under the Agreement. If Business Associate discloses to these third parties any PHI received from Covered Entity in this context, or created or received by Business Associate on behalf of Covered Entity, Business Associate shall require such third parties to agree to be bound by the same restrictions and conditions that apply to Business Associate under this Addendum.</p>
				<p><b>Reporting of Unauthorized Uses and Disclosures. </b>If Business Associate becomes aware of any use or disclosure of PHI by Business Associate, its employee, or its agents that is not provided for in this Addendum Business Associate shall report such violation to Covered Entity.</p>
				<p><b>Access to Information. </b>Within twenty (20) business days of Covered Entity’s written</p>
				<p>request, Business Associate shall provide Covered Entity with access to PHI in Business Associate’s possession, to the extent that Business Associate’s information consists of a Designated Record Set of the Covered Entity.</p>
				<p><b>Availability of PHI for Amendment. </b>The parties acknowledge that the Privacy Standards permit an individual who is the subject of PHI to request certain amendments of their records. Upon Covered Entity’s written request, Business Associate shall provide Covered Entity with any PHI contained in a Designated Record Set of the Covered Entity in Business Associate’s possession for amendment.</p>
				<p><b>Accounting of Disclosures.</b> Upon Covered Entity’s written request, Business Associate</p>
				<p>shall make available to Covered Entity information concerning Business Associate’s disclosure of PHI for which Covered Entity needs to provide an individual with an accounting of disclosure as required by the Privacy Standards. Should an accounting of PHI of a particular individual be requested more than one in any twelve (12) month period, Business Associate may charge Covered Entity a reasonable, cost-based fee.</p>
				<p><b>Availability of Books and Records. </b>For purposes of determining Covered Entity’s</p>
				<p>compliance with the Privacy Standards, Business Associate agrees to make available to the Secretary its internal policies and procedures relating to the use and disclosure of PHI received from, or created or received by Business Associate on behalf of Covered Entity. In the absence of any such internal policies and procedures, Business Associate hereby declares that its policy regarding the use and disclosure of PHI is that all PHI will be received, handled, safeguarded and protected against disclosure in a manner consistent with this Addendum, using whatever means are reasonable and necessary under applicable law to do so.</p>
				<p><b>Return of PHI at Termination. </b>Upon termination of the Agreement, Business Associate shall, where feasible, destroy or return to Covered Entity all PHI received from, or created or received by Business Associate on behalf of Covered Entity in connection with the performance of its services. Where such return or destruction is not feasible, the duties of Business Associate under this Agreement shall be extended to protect the PHI retained by Business Associate. Business Associate agrees to further limit uses and disclosures of the information retained to those purposes, which made the return or destruction infeasible. For example, when record retention laws require the Business Associate to keep records for a specific time.</p>
				<p>Notwithstanding any other limitation of this section, Covered Entity agrees that it is not necessary for Business Associate to return or destroy PHI received from, or created or received by Business Associate on behalf of Covered Entity if patient authorizations permitting such retention have been executed.</p>
				<p><b>4. Term and Termination</b></p>
				<p><b>Basic Term.</b> The Effective Date of this Addendum shall be the date on which both parties have executed the Agreement. This Addendum shall remain in effect indefinitely from the Effective Date unless terminated as provided below, or until the expiration or termination of the Agreement. </p>
				<p><b>Termination for Breach. </b>Where either party has knowledge of a material breach by the other party, the non-breaching party shall provide the breaching party with an opportunity to cure. Where said breach is not cured to the reasonable satisfaction of the non-breaching party within thirty (30) business days of the breaching party’s receipt of notice from the non-breaching party of said breach, the non-breaching party shall, if feasible, terminate this Agreement. Where either party has knowledge of a material breach by the other party and cure is not possible, the non-breaching party shall, if feasible, terminate this Agreement..</p>
				<p><b>5. Covered Entity Obligations</b></p>
				<p><b>Notification. </b>Covered Entity shall notify Business Associate of: (1) any limitations in its notice of privacy practices in accordance with 45 CFR Sec. 164.520 to the extent that such limitations may affect Business Associate’s use or disclosure of PHI; (2) any changes in, or revocations of, permission by Individuals to use or disclose PHI, to the extent that such actions may affect Business Associate’s use or disclosure of PHI; and (3) any restrictions on the use or disclosure of PHI that CE has agreed to in accordance with 45 CFR Sec. 164.522, to the extent that such limitations may affect Business Associate’s use or disclosure of PHI.</p>
				<p><b>6. General Provisions</b></p>
				<p><b>Entire Agreement. </b>This Addendum constitutes the entire agreement of the Parties with respect tothe Parties' compliance with federal and/or state health information confidentiality laws and </p>
				<p>regulations, and supersedes any and all prior agreements or statements among the Parties hereto, </p>
				<p>both oral and written, concerning the subject matter hereof. This Addendum may not be amended, modified, or terminated except in writing with signatures of both Parties.</p>
				<p><b>Notice. </b>Any notices to be given hereunder to either Party shall be made via U.S. Mail or express </p>
				<p>courier to such Party’s last known address. Facsimile copies hereof shall be deemed to be originals.</p>
				<p><b>Relationship of Parties. </b>In the performance of the duties an obligations of the Partiespursuant to this Addendum, each of the Parties shall at all times be acting andperforming as an independent contractor, and nothing in this Addendum shall be</p>
				<p>construed or deemed to create a relationship of employer and employee, or partner,</p>
				<p>or joint venture, or principal and agent between the Parties.</p>
				<p><b>Amendment. </b>The parties agree to take such action as is necessary to amend this Agreement from time to time as is necessary for the Parties to comply with the requirements of the Privacy Standards.</p>
			</div>
		);
	}
};
