#include <stdio.h>
#include <stdlib.h>

void sort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

// FCFS Disk Scheduling
void fcfs(int req[], int n, int head) {
    int total = 0;
    printf("\nFCFS Disk Scheduling:\nOrder: %d", head);
    for (int i = 0; i < n; i++) {
        total += abs(req[i] - head);
        head = req[i];
        printf(" -> %d", head);
    }
    printf("\nTotal Head Movement = %d\n", total);
}

// SCAN Disk Scheduling
void scan(int req[], int n, int head, int disk_size, int direction) {
    int total = 0;
    int left[50], right[50];
    int lcount = 0, rcount = 0;

    if (direction == 0)
        left[lcount++] = 0;
    else
        right[rcount++] = disk_size - 1;

    for (int i = 0; i < n; i++) {
        if (req[i] < head)
            left[lcount++] = req[i];
        else
            right[rcount++] = req[i];
    }

    sort(left, lcount);
    sort(right, rcount);

    printf("\nSCAN Disk Scheduling:\nOrder: %d", head);

    if (direction == 0) { // moving left
        for (int i = lcount - 1; i >= 0; i--) {
            total += abs(head - left[i]);
            head = left[i];
            printf(" -> %d", head);
        }
        for (int i = 0; i < rcount; i++) {
            total += abs(head - right[i]);
            head = right[i];
            printf(" -> %d", head);
        }
    } else { // moving right
        for (int i = 0; i < rcount; i++) {
            total += abs(head - right[i]);
            head = right[i];
            printf(" -> %d", head);
        }
        for (int i = lcount - 1; i >= 0; i--) {
            total += abs(head - left[i]);
            head = left[i];
            printf(" -> %d", head);
        }
    }

    printf("\nTotal Head Movement = %d\n", total);
}

// C-SCAN Disk Scheduling
void cscan(int req[], int n, int head, int disk_size) {
    int total = 0;
    int left[50], right[50];
    int lcount = 0, rcount = 0;

    right[rcount++] = disk_size - 1;
    left[lcount++] = 0;

    for (int i = 0; i < n; i++) {
        if (req[i] < head)
            left[lcount++] = req[i];
        else
            right[rcount++] = req[i];
    }

    sort(left, lcount);
    sort(right, rcount);

    printf("\nC-SCAN Disk Scheduling:\nOrder: %d", head);

    for (int i = 0; i < rcount; i++) {
        total += abs(head - right[i]);
        head = right[i];
        printf(" -> %d", head);
    }

    // jump from end to start
    total += abs((disk_size - 1) - 0);
    head = 0;

    for (int i = 0; i < lcount; i++) {
        total += abs(head - left[i]);
        head = left[i];
        printf(" -> %d", head);
    }

    printf("\nTotal Head Movement = %d\n", total);
}

int main() {
    int n, head, disk_size, direction;
    int req[50];

    printf("Enter number of requests: ");
    scanf("%d", &n);

    printf("Enter request sequence:\n");
    for (int i = 0; i < n; i++)
        scanf("%d", &req[i]);

    printf("Enter initial head position: ");
    scanf("%d", &head);

    printf("Enter total disk size: ");
    scanf("%d", &disk_size);

    printf("Enter head movement direction (0 for left, 1 for right): ");
    scanf("%d", &direction);

    fcfs(req, n, head);
    scan(req, n, head, disk_size, direction);
    cscan(req, n, head, disk_size);

    return 0;
}