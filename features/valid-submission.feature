Feature: Feedback submission produces a conforming record

  Scenario: A valid submission produces a conforming record
    Given a user submits the feedback text "The export button does nothing when I click it on Safari"
    When the feedback is processed
    Then the resulting record conforms to the FeedbackRecord contract
    And the record's category, sentiment, severity, summary, and suggested action come from the model
