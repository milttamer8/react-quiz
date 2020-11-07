import React from 'react';
import UserProfile from '../../session/UserProfile';
import { useTranslation } from "react-i18next";

/*
 *   Static term and conditions page
*/
export default function TermsConditions(props) {
  const {t} = useTranslation('common');

    return (
      <div className="infosGeneral container">
        <div className="col-12">
            <div className="para" dangerouslySetInnerHTML={{ __html: t('terms_and_conditions_part_1.title') }} />
            <div className="para" dangerouslySetInnerHTML={{ __html: t('terms_and_conditions_part_link.title') }} />
            <div className="para" dangerouslySetInnerHTML={{ __html: t('terms_and_conditions_part_2.title') }} />
            <div className="para" dangerouslySetInnerHTML={{ __html: t('terms_and_conditions_part_link_2.title') }} />
            <div className="para" dangerouslySetInnerHTML={{ __html: t('terms_and_conditions_part_3.title') }} />
        </div>
      </div>
    );
}