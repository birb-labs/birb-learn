import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import styles from './ContentTreePage.module.css';

interface AdminLesson {
  id: number;
  slug: string;
  title: string;
}

interface AdminSection {
  slug: string;
  name: string;
  lessons: AdminLesson[];
}

interface AdminTopic {
  slug: string;
  name: string;
  sections: AdminSection[];
}

interface AdminSubject {
  slug: string;
  name: string;
  topics: AdminTopic[];
}

interface AdminDiscipline {
  slug: string;
  name: string;
  subjects: AdminSubject[];
}

export function ContentTreePage({ onEditLesson }: { onEditLesson: (lessonId: number) => void }) {
  const [tree, setTree] = useState<AdminDiscipline[]>([]);

  useEffect(() => {
    apiFetch('/api/lessons/tree')
      .then((response) => response.json<AdminDiscipline[]>())
      .then(setTree);
  }, []);

  return (
    <div className={styles.tree}>
      {tree.map((discipline) => (
        <div key={discipline.slug}>
          <strong>{discipline.name}</strong>
          {discipline.subjects.map((subject) => (
            <div key={subject.slug} className={styles.subject}>
              <strong>{subject.name}</strong>
              {subject.topics.map((topic) => (
                <div key={topic.slug} className={styles.topic}>
                  {topic.name}
                  {topic.sections.map((section) => (
                    <div key={section.slug} className={styles.section}>
                      {section.name}
                      {section.lessons.map((lesson) => (
                        <div key={lesson.id} className={styles.lesson}>
                          <button type="button" className={styles.lessonLink} onClick={() => onEditLesson(lesson.id)}>
                            {lesson.title}
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
