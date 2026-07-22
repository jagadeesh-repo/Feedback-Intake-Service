Feature: Invalid model output is retried then flagged

  Scenario: The model returns content that does not satisfy the contract
    Given the AI model always returns content that fails the FeedbackRecord contract
    When the feedback "This is fine I guess" is processed
    Then the model is called exactly 2 times
    And the resulting extraction is flagged as failed
    And the failure is visible rather than silently defaulted
