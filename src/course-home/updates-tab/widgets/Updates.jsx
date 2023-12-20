import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import SanitizeHtmlFragment from '../../outline-tab/SanitizeHtmlFragment';
import { useModel } from '../../../generic/model-store';

const Updates = ({ courseId, intl }) => {

  const {
    courseUpdates,
  } = useModel('updates', courseId);

  if (!courseUpdates) {
    return null;
  }

  return (
    <SanitizeHtmlFragment
      className="inline-link"
      data-testid="long-welcome-message-iframe"
      key="full-html"
      html={courseUpdates}
    />
  );
};

Updates.propTypes = {
  courseId: PropTypes.string.isRequired,
  intl: intlShape.isRequired,
};

export default injectIntl(Updates);
