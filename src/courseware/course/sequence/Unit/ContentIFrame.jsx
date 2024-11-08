import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { getConfig } from '@edx/frontend-platform';
import { ErrorPage } from '@edx/frontend-platform/react';
import { StrictDict } from '@edx/react-unit-test-utils';
import { ModalDialog, Modal } from '@openedx/paragon';
import { useSelector } from 'react-redux';
import { PluginSlot } from '@openedx/frontend-plugin-framework';
import PageLoading from '@src/generic/PageLoading';
import * as hooks from './hooks';
import { getProgressTabData } from '@src/course-home/data/api';
import SanitizeHtmlFragment from '@src/course-home/outline-tab/SanitizeHtmlFragment';


/**
 * Feature policy for iframe, allowing access to certain courseware-related media.
 *
 * We must use the wildcard (*) origin for each feature, as courseware content
 * may be embedded in external iframes. Notably, xblock-lti-consumer is a popular
 * block that iframes external course content.

 * This policy was selected in conference with the edX Security Working Group.
 * Changes to it should be vetted by them (security@edx.org).
 */
export const IFRAME_FEATURE_POLICY = (
  'microphone *; camera *; midi *; geolocation *; encrypted-media *; clipboard-write *'
);

export const testIDs = StrictDict({
  contentIFrame: 'content-iframe-test-id',
  modalIFrame: 'modal-iframe-test-id',
});

const examSuccess = () => getConfig().GYM_MSG?.learning?.exam_success;
const examFailure = () => getConfig().GYM_MSG?.learning?.exam_failure;
const examFailedAttempt = () => getConfig().GYM_MSG?.learning?.exam_failed_attempt;

const ContentIFrame = ({
  iframeUrl,
  shouldShowContent,
  loadingMessage,
  id,
  elementId,
  onLoaded,
  title,
  courseId,
}) => {
  const {
    handleIFrameLoad,
    hasLoaded,
    iframeHeight,
    showError,
  } = hooks.useIFrameBehavior({
    elementId,
    id,
    iframeUrl,
    onLoaded,
  });

  const {
    modalOptions,
    handleModalClose,
  } = hooks.useModalIFrameData();
  const { certificateData } = useSelector(state => state.models.coursewareMeta[courseId]);
  const contentIFrameProps = {
    id: elementId,
    src: iframeUrl,
    allow: IFRAME_FEATURE_POLICY,
    allowFullScreen: true,
    height: iframeHeight,
    scrolling: 'no',
    referrerPolicy: 'origin',
    onLoad: handleIFrameLoad,
  };
  const [isPassing, setIsPassing] = useState(false);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [shouldEnableSubmitButton, setShouldEnableSubmitButton] = useState(true);

  let modalContent;
  if (modalOptions.isOpen) {
    modalContent = modalOptions.body
      ? <div className="unit-modal">{ modalOptions.body }</div>
      : (
        <iframe
          title={modalOptions.title}
          allow={IFRAME_FEATURE_POLICY}
          frameBorder="0"
          src={modalOptions.url}
          style={{ width: '100%', height: modalOptions.height }}
        />
      );
  }

  useEffect(() => {
    const handleMessage = async (event) => {
      // Check if this is our submission message
      if (event.data?.type === 'problem_check' && event.data?.action === 'submit') {
        if (courseId) {
          // wait for a second to get the latest data
          setTimeout(async () => {
            const progressData = await getProgressTabData(courseId);
            setIsPassing(progressData.courseGrade.isPassing);
            setAttemptsUsed(event.data.attempts_used + 1);
            setShouldEnableSubmitButton(event.data.should_enable_submit_button);
          }, 1000);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <>
      {(shouldShowContent && !hasLoaded) && (
        showError ? <ErrorPage /> : (
          <PluginSlot
            id="content_iframe_loader_slot"
            pluginProps={{
              defaultLoaderComponent: <PageLoading srMessage={loadingMessage} />,
              courseId,
            }}
          >
            <PageLoading srMessage={loadingMessage} />
          </PluginSlot>
        )
      )}

      {shouldShowContent && (
        <div className="unit-iframe-wrapper">
          <iframe title={title} {...contentIFrameProps} data-testid={testIDs.contentIFrame} />
          {
            title?.toLowerCase() === 'final exam' && (() => {
              let examNotificationMessage;
              if (certificateData?.downloadUrl || isPassing) {
                examNotificationMessage = examSuccess();
              } else if (!isPassing && attemptsUsed >= 2) {
                examNotificationMessage = examFailure();
              } else if (!isPassing && attemptsUsed == 1) {
                examNotificationMessage = examFailedAttempt();
              }
              return examNotificationMessage && (
                <SanitizeHtmlFragment
                  className="final-exam-wrapper"
                  html={examNotificationMessage}
                />
              );
            })()
          }
        </div>
      )}

      {modalOptions.isOpen && (modalOptions.isFullscreen
        ? (
          <ModalDialog
            dialogClassName="modal-lti"
            onClose={handleModalClose}
            size="fullscreen"
            isOpen
            hasCloseButton={false}
          >
            <ModalDialog.Body className={modalOptions.modalBodyClassName}>
              {modalContent}
            </ModalDialog.Body>
          </ModalDialog>

        ) : (
          <Modal
            body={modalContent}
            dialogClassName="modal-lti"
            onClose={handleModalClose}
            open
          />
        )
      )}
    </>
  );
};

ContentIFrame.propTypes = {
  iframeUrl: PropTypes.string,
  id: PropTypes.string.isRequired,
  shouldShowContent: PropTypes.bool.isRequired,
  loadingMessage: PropTypes.node.isRequired,
  elementId: PropTypes.string.isRequired,
  onLoaded: PropTypes.func,
  title: PropTypes.node.isRequired,
  courseId: PropTypes.string,
};

ContentIFrame.defaultProps = {
  iframeUrl: null,
  onLoaded: () => ({}),
  courseId: '',
};

export default ContentIFrame;
