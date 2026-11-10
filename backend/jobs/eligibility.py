# backend/jobs/eligibility.py
"""
Eligibility checker.

Given a User (student) and a Job, decide whether the student is
allowed to apply. Returns (eligible: bool, reasons: list[str]).

The reasons list is always populated when the student is NOT eligible,
with one human-readable string per failed check. Useful for the UI
to show the student exactly why they can't apply.
"""


def _split_csv(s):
    """Split a comma-separated field into a clean lowercase list."""
    if not s:
        return []
    return [item.strip().lower() for item in s.split(',') if item.strip()]


def check_eligibility(student_user, job):
    reasons = []

    # ----- Get graduation record -----
    try:
        profile = student_user.profile
    except Exception:
        return False, ["Student profile not found."]

    grad = profile.educations.filter(level='GRAD').order_by('-passing_year').first()
    if not grad:
        return False, ["Graduation education record not found. Please add your graduation details in your profile."]

    # ----- Percentage -----
    if job.min_percentage is not None and grad.percentage is not None:
        if grad.percentage < job.min_percentage:
            reasons.append(
                f"Minimum percentage required: {job.min_percentage}% (yours: {grad.percentage}%)"
            )

    # ----- CGPA -----
    if job.min_cgpa is not None and grad.cgpa is not None:
        if grad.cgpa < job.min_cgpa:
            reasons.append(
                f"Minimum CGPA required: {job.min_cgpa} (yours: {grad.cgpa})"
            )

    # ----- Active backlogs -----
    if grad.active_backlogs > job.max_backlogs:
        reasons.append(
            f"Maximum active backlogs allowed: {job.max_backlogs} (yours: {grad.active_backlogs})"
        )

    # ----- Passing year -----
    if job.passing_year_from and grad.passing_year < job.passing_year_from:
        reasons.append(
            f"Passing year must be at least {job.passing_year_from} (yours: {grad.passing_year})"
        )
    if job.passing_year_to and grad.passing_year > job.passing_year_to:
        reasons.append(
            f"Passing year must be at most {job.passing_year_to} (yours: {grad.passing_year})"
        )

    # ----- Branch -----
    allowed_branches = _split_csv(job.eligible_branches)
    if allowed_branches and grad.branch:
        if grad.branch.strip().lower() not in allowed_branches:
            reasons.append(
                f"Branch '{grad.branch}' is not in the eligible branches: {job.eligible_branches}"
            )

    # ----- Degree -----
    allowed_degrees = _split_csv(job.eligible_degrees)
    if allowed_degrees and grad.degree:
        if grad.degree.strip().lower() not in allowed_degrees:
            reasons.append(
                f"Degree '{grad.degree}' is not in the eligible degrees: {job.eligible_degrees}"
            )

    # ----- Experience -----
    exp_count = profile.experiences.count()
    if job.min_experience and exp_count < job.min_experience:
        reasons.append(
            f"Minimum {job.min_experience} experience record(s) required (yours: {exp_count})"
        )

    # ----- Required skills -----
    required = _split_csv(job.required_skills)
    if required:
        student_skills = {s.skill_name.strip().lower() for s in profile.technical_skills.all()}
        missing = [s for s in required if s not in student_skills]
        if missing:
            reasons.append(
                f"Missing required skill(s): {', '.join(missing)}"
            )

    return (len(reasons) == 0, reasons)