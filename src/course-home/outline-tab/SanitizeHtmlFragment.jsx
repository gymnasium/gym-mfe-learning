import React from 'react';
import PropTypes from 'prop-types';
import dompurify from 'dompurify';

const SanitizeHtmlFragment = ({
  className,
  html,
}) => {
  const markup = { __html: dompurify.sanitize(html) };

  return (
    <div className={className} dangerouslySetInnerHTML={markup} />
  );
};

SanitizeHtmlFragment.defaultProps = {
  className: '',
};

SanitizeHtmlFragment.propTypes = {
  className: PropTypes.string,
  html: PropTypes.string.isRequired,
};

export default SanitizeHtmlFragment;
